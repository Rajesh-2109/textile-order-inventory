const TextileProcess = require("../Model/TextileProcess");
const Expense = require("../Model/Expense");
const Order = require("../Model/Order");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const audit = require("../utils/audit");
const list = asyncHandler(async (req, res) => {
  const filter = req.query.order ? { order: req.query.order } : {};
  const data = await TextileProcess.find(filter)
    .populate("order", "orderNumber buyerPONumber")
    .sort({ createdAt: 1 });
  res.json({ success: true, data });
});
const create = asyncHandler(async (req, res) => {
  if (!(await Order.exists({ _id: req.body.order })))
    throw new ApiError(404, "Order not found");
  const data = await TextileProcess.create({
    ...req.body,
    updatedBy: req.user._id,
  });
  audit(
    req.user,
    "create",
    "TextileProcess",
    data._id,
    `Created ${data.stage}`,
  );
  res.status(201).json({ success: true, data });
});
const update = asyncHandler(async (req, res) => {
  const data = await TextileProcess.findById(req.params.id);
  if (!data) throw new ApiError(404, "Process not found");
  const allowed = [
    "stage",
    "plannedQty",
    "completedQty",
    "unit",
    "plannedCostINR",
    "actualCostINR",
    "vendor",
    "startDate",
    "targetDate",
    "notes",
  ];
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) data[k] = req.body[k];
  });
  data.updatedBy = req.user._id;
  await data.save();
  audit(
    req.user,
    "update",
    "TextileProcess",
    data._id,
    `Updated ${data.stage}`,
  );
  res.json({ success: true, data });
});
const remove = asyncHandler(async (req, res) => {
  const data = await TextileProcess.findByIdAndDelete(req.params.id);
  if (!data) throw new ApiError(404, "Process not found");
  audit(
    req.user,
    "delete",
    "TextileProcess",
    data._id,
    `Deleted ${data.stage}`,
  );
  res.json({ success: true, message: "Process deleted" });
});
const addExpense = asyncHandler(async (req, res) => {
  const data = await Expense.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data });
});
const listExpenses = asyncHandler(async (req, res) => {
  const data = await Expense.find(
    req.query.order ? { order: req.query.order } : {},
  )
    .populate("order", "orderNumber")
    .sort({ createdAt: -1 });
  res.json({ success: true, data });
});
module.exports = { list, create, update, remove, addExpense, listExpenses };
