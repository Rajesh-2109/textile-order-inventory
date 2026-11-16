const mongoose = require("mongoose");

const Order = require("../Model/Order");
const Buyer = require("../Model/Buyer");
const Product = require("../Model/Product");
const Counter = require("../Model/Counter");

const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const audit = require("../utils/audit");

const { escapeRegex, parsePaging, pagination } = require("../utils/query");

const CLOSED = ["Dispatched", "Completed", "Cancelled"];

const EDITABLE = ["Draft", "Confirmed"];

const DELETABLE = ["Draft", "Cancelled"];

const TRANSITIONS = {
  Draft: ["Confirmed", "Cancelled"],
  Confirmed: ["Materials Pending", "In Production", "Cancelled"],
  "Materials Pending": ["In Production", "Cancelled"],
  "In Production": ["Quality Check", "Cancelled"],
  "Quality Check": ["Ready to Dispatch", "In Production"],
  "Ready to Dispatch": ["Dispatched"],
  Dispatched: ["Completed"],
  Completed: [],
  Cancelled: [],
};

const FIELDS = [
  "buyer",
  "buyerPONumber",
  "orderDate",
  "deliveryDate",
  "currency",
  "notes",
];

const SORTABLE = [
  "createdAt",
  "orderDate",
  "deliveryDate",
  "status",
  "totalAmount",
];

// Generate order number
const nextOrderNumber = async () => {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { key: `order-${year}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );

  return `ORD-${year}-${String(counter.seq).padStart(4, "0")}`;
};

// Validate buyer
const checkBuyer = async (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid buyer");
  }

  const buyer = await Buyer.findOne({
    _id: id,
    isActive: true,
  }).select("_id");

  if (!buyer) {
    throw new ApiError(400, "Buyer not found or inactive");
  }
};

// Validate products and build order items
const buildItems = async (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "At least one item is required");
  }

  const ids = items.map((item) => item.product);

  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw new ApiError(400, "Invalid product in items");
  }

  const found = await Product.find({
    _id: { $in: ids },
    isActive: true,
  }).select("_id");

  const validIds = new Set(found.map((product) => String(product._id)));

  return items.map((item) => {
    if (!validIds.has(String(item.product))) {
      throw new ApiError(400, "A product is missing or inactive");
    }

    return {
      product: item.product,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    };
  });
};

// Pick allowed fields only
const pickFields = (body) =>
  FIELDS.reduce((result, key) => {
    if (body[key] !== undefined) {
      result[key] = body[key];
    }

    return result;
  }, {});

// Populate order details
const populateOrder = (query) =>
  query
    .populate("buyer", "buyerCode companyName")
    .populate("items.product", "sku name unit");

// GET all active orders
const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);

  const filter = {
    isArchived: { $ne: true },
  };

  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), "i");

    filter.$or = [{ orderNumber: regex }, { buyerPONumber: regex }];
  }

  if (req.query.status && Order.STATUSES.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  if (req.query.buyer && mongoose.isValidObjectId(req.query.buyer)) {
    filter.buyer = req.query.buyer;
  }

  if (req.query.from || req.query.to) {
    filter.deliveryDate = {};

    if (req.query.from) {
      filter.deliveryDate.$gte = new Date(req.query.from);
    }

    if (req.query.to) {
      filter.deliveryDate.$lte = new Date(req.query.to);
    }
  }

  if (req.query.overdue === "true") {
    filter.deliveryDate = {
      ...(filter.deliveryDate || {}),
      $lt: new Date(),
    };

    filter.status = { $nin: CLOSED };
  }

  const sortBy = SORTABLE.includes(req.query.sort)
    ? req.query.sort
    : "createdAt";

  const direction = req.query.order === "asc" ? 1 : -1;

  const [data, total] = await Promise.all([
    populateOrder(
      Order.find(filter)
        .sort({ [sortBy]: direction })
        .skip(skip)
        .limit(limit),
    ),

    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data,
    pagination: pagination(page, limit, total),
  });
});

// GET one active order
const getOne = asyncHandler(async (req, res) => {
  const order = await populateOrder(
    Order.findOne({
      _id: req.params.id,
      isArchived: { $ne: true },
    }),
  );

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  res.json({
    success: true,
    data: order,
  });
});

// CREATE order
const create = asyncHandler(async (req, res) => {
  await checkBuyer(req.body.buyer);

  const items = await buildItems(req.body.items);

  const order = await Order.create({
    ...pickFields(req.body),
    items,
    status: "Draft",
    orderNumber: await nextOrderNumber(),
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  audit(req.user, "create", "Order", order._id, `Created ${order.orderNumber}`);

  res.status(201).json({
    success: true,
    data: order,
  });
});

// UPDATE order
const update = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    isArchived: { $ne: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!EDITABLE.includes(order.status)) {
    throw new ApiError(
      400,
      `Order cannot be edited when status is ${order.status}`,
    );
  }

  if (req.body.buyer !== undefined) {
    await checkBuyer(req.body.buyer);
  }

  order.set(pickFields(req.body));

  if (req.body.items !== undefined) {
    order.items = await buildItems(req.body.items);
  }

  order.updatedBy = req.user._id;

  await order.save();

  audit(req.user, "update", "Order", order._id, `Updated ${order.orderNumber}`);

  res.json({
    success: true,
    data: order,
  });
});

// CHANGE order status
const changeStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    isArchived: { $ne: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const { status } = req.body;

  if (!(TRANSITIONS[order.status] || []).includes(status)) {
    throw new ApiError(
      400,
      `Cannot change status from ${order.status} to ${status}`,
    );
  }

  const previousStatus = order.status;

  order.status = status;
  order.updatedBy = req.user._id;

  await order.save();

  audit(
    req.user,
    "status",
    "Order",
    order._id,
    `${order.orderNumber}: ${previousStatus} -> ${status}`,
  );

  res.json({
    success: true,
    data: order,
  });
});

// ARCHIVE order instead of permanent deletion
const remove = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    isArchived: { $ne: true },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (!DELETABLE.includes(order.status)) {
    throw new ApiError(400, "Only Draft or Cancelled orders can be archived");
  }

  order.isArchived = true;
  order.archivedAt = new Date();
  order.archivedBy = req.user._id;
  order.updatedBy = req.user._id;

  await order.save();

  audit(
    req.user,
    "archive",
    "Order",
    order._id,
    `Archived ${order.orderNumber}`,
  );

  res.json({
    success: true,
    message: "Order archived. Its expenses have been preserved.",
  });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  changeStatus,
  remove,
};
