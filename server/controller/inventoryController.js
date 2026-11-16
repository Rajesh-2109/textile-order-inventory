const mongoose = require("mongoose");
const Tx = require("../Model/InventoryTransaction");
const Product = require("../Model/Product");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const audit = require("../utils/audit");
const { parsePaging, pagination } = require("../utils/query");

const getBalance = async (product, location) => {
  const r = await Tx.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(product)), location } },
    { $group: { _id: null, total: { $sum: "$signedQty" } } },
  ]);
  return r[0]?.total || 0;
};

// Stock on hand per product + location
const stock = asyncHandler(async (req, res) => {
  const rows = await Tx.aggregate([
    { $group: { _id: { product: "$product", location: "$location" }, quantity: { $sum: "$signedQty" } } },
    { $lookup: { from: "products", localField: "_id.product", foreignField: "_id", as: "p" } },
    { $unwind: "$p" },
    {
      $project: {
        _id: 0,
        location: "$_id.location",
        quantity: 1,
        product: {
          _id: "$p._id",
          sku: "$p.sku",
          name: "$p.name",
          unit: "$p.unit",
          reorderLevel: "$p.reorderLevel",
        },
      },
    },
    { $sort: { "product.sku": 1, location: 1 } },
  ]);

  let data = rows.map((r) => ({
    ...r,
    low: r.product.reorderLevel > 0 && r.quantity <= r.product.reorderLevel,
  }));
  if (req.query.low === "true") data = data.filter((r) => r.low);
  res.json({ success: true, data });
});

const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = {};
  if (req.query.product && mongoose.isValidObjectId(req.query.product)) filter.product = req.query.product;
  if (["IN", "OUT", "ADJUST"].includes(req.query.type)) filter.type = req.query.type;
  if (req.query.location) filter.location = String(req.query.location);

  const [data, total] = await Promise.all([
    Tx.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("product", "sku name unit")
      .populate("createdBy", "name"),
    Tx.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pagination(page, limit, total) });
});

const createTransaction = asyncHandler(async (req, res) => {
  const { product, type, quantity, reason, reference } = req.body;
  const location = (req.body.location || "Main").trim();

  if (!mongoose.isValidObjectId(product)) throw new ApiError(400, "Invalid product");
  const prod = await Product.findOne({ _id: product, isActive: true }).select("_id");
  if (!prod) throw new ApiError(400, "Product not found or inactive");

  const tx = new Tx({
    product,
    type,
    quantity: Number(quantity),
    location,
    reason,
    reference,
    createdBy: req.user._id,
  });
  await tx.validate(); // also calculates signedQty

  // Negative stock is not allowed
  if (tx.signedQty < 0) {
    const balance = await getBalance(product, location);
    if (balance + tx.signedQty < 0) {
      throw new ApiError(400, `Insufficient stock at ${location}. Available: ${balance}`);
    }
  }
  await tx.save();
  audit(req.user, "create", "InventoryTransaction", tx._id, `${type} ${tx.quantity} @ ${location}: ${reason}`);
  res.status(201).json({ success: true, data: tx });
});

module.exports = { stock, listTransactions, createTransaction };
