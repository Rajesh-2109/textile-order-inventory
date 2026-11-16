const Order = require("../Model/Order");
const Buyer = require("../Model/Buyer");
const Product = require("../Model/Product");
const Tx = require("../Model/InventoryTransaction");
const asyncHandler = require("../utils/asyncHandler");

const CLOSED = ["Dispatched", "Completed", "Cancelled"];

const summary = asyncHandler(async (req, res) => {
  const now = new Date();
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const [byStatus, overdue, dueSoon, buyers, products, lowStock] = await Promise.all([
    Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Order.countDocuments({ status: { $nin: CLOSED }, deliveryDate: { $lt: now } }),
    Order.countDocuments({ status: { $nin: CLOSED }, deliveryDate: { $gte: now, $lte: soon } }),
    Buyer.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true }),
    Tx.aggregate([
      { $group: { _id: "$product", total: { $sum: "$signedQty" } } },
      { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "p" } },
      { $unwind: "$p" },
      {
        $match: {
          "p.isActive": true,
          "p.reorderLevel": { $gt: 0 },
          $expr: { $lte: ["$total", "$p.reorderLevel"] },
        },
      },
      { $count: "n" },
    ]),
  ]);

  const ordersByStatus = {};
  byStatus.forEach((s) => (ordersByStatus[s._id] = s.count));
  const openOrders = byStatus.filter((s) => !CLOSED.includes(s._id)).reduce((a, s) => a + s.count, 0);

  res.json({
    success: true,
    data: {
      openOrders,
      overdue,
      dueSoon,
      buyers,
      products,
      lowStock: lowStock[0]?.n || 0,
      ordersByStatus,
    },
  });
});

module.exports = { summary };
