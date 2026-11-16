const Buyer = require("../Model/Buyer");
const Order = require("../Model/Order");
const asyncHandler = require("../utils/asyncHandler");
const audit = require("../utils/audit");
const { escapeRegex, parsePaging, pagination } = require("../utils/query");

const FIELDS = ["buyerCode", "companyName", "contactName", "email", "phone", "address", "isActive"];
const SORTABLE = ["createdAt", "buyerCode", "companyName"];

// only allowed fields are copied from req.body (no mass assignment)
const pick = (body) =>
  FIELDS.reduce((o, k) => {
    if (body[k] !== undefined) o[k] = body[k];
    return o;
  }, {});

const createBuyer = asyncHandler(async (req, res) => {
  const buyer = await Buyer.create({ ...pick(req.body), createdBy: req.user._id, updatedBy: req.user._id });
  audit(req.user, "create", "Buyer", buyer._id, `Created buyer ${buyer.buyerCode}`);
  res.status(201).json({ message: "Buyer Created", data: buyer });
});

const getBuyers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = {};

  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ buyerCode: rx }, { companyName: rx }, { contactName: rx }, { email: rx }];
  }
  if (req.query.isActive === "true" || req.query.isActive === "false") {
    filter.isActive = req.query.isActive === "true";
  }

  const sortBy = SORTABLE.includes(req.query.sort) ? req.query.sort : "createdAt";
  const dir = req.query.order === "asc" ? 1 : -1;

  const [data, total] = await Promise.all([
    Buyer.find(filter).sort({ [sortBy]: dir }).skip(skip).limit(limit),
    Buyer.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pagination(page, limit, total) });
});

const getSingleBuyer = asyncHandler(async (req, res) => {
  const buyer = await Buyer.findById(req.params.id);
  if (!buyer) return res.status(404).json({ message: "Buyer not found" });
  res.json({ data: buyer });
});

const updateBuyer = asyncHandler(async (req, res) => {
  const buyer = await Buyer.findById(req.params.id);
  if (!buyer) return res.status(404).json({ message: "Buyer not found" });

  buyer.set(pick(req.body));
  buyer.updatedBy = req.user._id;
  await buyer.save();

  audit(req.user, "update", "Buyer", buyer._id, `Updated buyer ${buyer.buyerCode}`);
  res.json({ message: "Buyer Updated", data: buyer });
});

// Delete: removed completely if unused. If old orders use this buyer it is
// deactivated instead, so order history never breaks.
const deleteBuyer = asyncHandler(async (req, res) => {
  const buyer = await Buyer.findById(req.params.id);
  if (!buyer) return res.status(404).json({ message: "Buyer not found" });

  if (await Order.exists({ buyer: buyer._id })) {
    buyer.isActive = false;
    buyer.updatedBy = req.user._id;
    await buyer.save();
    audit(req.user, "deactivate", "Buyer", buyer._id, `Deactivated buyer ${buyer.buyerCode}`);
    return res.json({ message: "Buyer is used in orders, so it was deactivated instead of deleted" });
  }

  await buyer.deleteOne();
  audit(req.user, "delete", "Buyer", buyer._id, `Deleted buyer ${buyer.buyerCode}`);
  res.json({ message: "Buyer Deleted" });
});

module.exports = { createBuyer, getBuyers, getSingleBuyer, updateBuyer, deleteBuyer };
