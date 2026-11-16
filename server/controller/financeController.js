const Order = require("../Model/Order");
const Expense = require("../Model/Expense");
const TextileProcess = require("../Model/TextileProcess");
const AppSetting = require("../Model/AppSetting");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");

// Get USD to INR exchange rate
const getRate = async () => {
  const setting = await AppSetting.findOne({
    key: "usdInrRate",
  });

  return Number(setting?.value || 90);
};

// GET admin finance data
const getFinance = asyncHandler(async (req, res) => {
  const exchangeRate = await getRate();

  // Include active, archived and cancelled orders.
  // Archived orders are needed to preserve their expenses.
  const orders = await Order.find({})
    .populate("buyer", "companyName")
    .sort({ createdAt: -1 });

  const result = [];

  for (const order of orders) {
    // Calculate recorded expenses
    const expenses = await Expense.aggregate([
      {
        $match: {
          order: order._id,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amountINR",
          },
        },
      },
    ]);

    // Calculate textile process costs
    const processCosts = await TextileProcess.aggregate([
      {
        $match: {
          order: order._id,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$actualCostINR",
          },
        },
      },
    ]);

    const expenseTotal = expenses[0]?.total || 0;
    const processCostTotal = processCosts[0]?.total || 0;

    // Total expenses including process costs
    const totalCost = expenseTotal + processCostTotal;

    // Convert order value into INR
    const calculatedOrderValueINR =
      order.currency === "USD"
        ? order.totalAmount * exchangeRate
        : order.totalAmount;

    // Archived/deleted and cancelled orders
    // must not contribute revenue.
    const isDeletedOrder =
      order.isArchived === true || order.status === "Cancelled";

    const orderValueINR = isDeletedOrder ? 0 : calculatedOrderValueINR;

    // Expenses remain even when order is archived.
    const profitLossINR = orderValueINR - totalCost;

    result.push({
      orderId: order._id,
      orderNumber: order.orderNumber,
      buyer: order.buyer?.companyName || "",

      currency: order.currency,
      status: order.status,

      isArchived: order.isArchived || false,
      archivedAt: order.archivedAt || null,

      orderValueOriginal: order.totalAmount,
      orderValueINR: orderValueINR,

      expensesINR: totalCost,
      profitLossINR: profitLossINR,

      exchangeRateINR: exchangeRate,
    });
  }

  res.json({
    success: true,
    data: {
      exchangeRateINR: exchangeRate,
      orders: result,
    },
  });
});

// UPDATE USD to INR exchange rate
const updateRate = asyncHandler(async (req, res) => {
  const rate = Number(req.body.exchangeRateINR);

  if (!Number.isFinite(rate) || rate <= 0) {
    throw new ApiError(400, "Enter a valid INR exchange rate");
  }

  await AppSetting.findOneAndUpdate(
    {
      key: "usdInrRate",
    },
    {
      value: rate,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  res.json({
    success: true,
    exchangeRateINR: rate,
  });
});

// GET production progress
const orderProgress = asyncHandler(async (req, res) => {
  // Hide archived and cancelled orders from progress.
  const orders = await Order.find({
    status: {
      $ne: "Cancelled",
    },
    isArchived: {
      $ne: true,
    },
  }).select("orderNumber");

  const data = [];

  for (const order of orders) {
    const stages = await TextileProcess.find({
      order: order._id,
    }).select("stage plannedQty completedQty");

    data.push({
      orderId: order._id,
      orderNumber: order.orderNumber,

      stages: stages.map((stage) => ({
        ...stage.toObject(),

        remainingQty: Math.max(0, stage.plannedQty - stage.completedQty),

        percent: stage.plannedQty
          ? Math.round((stage.completedQty / stage.plannedQty) * 100)
          : 0,
      })),
    });
  }

  res.json({
    success: true,
    data,
  });
});

module.exports = {
  getFinance,
  updateRate,
  orderProgress,
};
