const Product = require("../Model/Product");
const Order = require("../Model/Order");
const InventoryTransaction = require("../Model/InventoryTransaction");
const asyncHandler = require("../utils/asyncHandler");
const audit = require("../utils/audit");
const removeFile = require("../utils/removeFile");
const { escapeRegex, parsePaging, pagination } = require("../utils/query");

const FIELDS = ["sku", "name", "category", "material", "size", "colour", "unit", "reorderLevel", "description", "isActive"];
const SORTABLE = ["createdAt", "sku", "name"];

const pick = (body) =>
  FIELDS.reduce((o, k) => {
    if (body[k] !== undefined) o[k] = body[k];
    return o;
  }, {});

const createProduct = asyncHandler(async (req, res) => {
  try {
    const product = await Product.create({
      ...pick(req.body),
      image: req.file ? req.file.filename : undefined,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    audit(req.user, "create", "Product", product._id, `Created product ${product.sku}`);
    res.status(201).json({ message: "Product Created", data: product });
  } catch (error) {
    if (req.file) removeFile(req.file.filename); // do not keep the image if save failed
    throw error;
  }
});

const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = {};

  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ sku: rx }, { name: rx }, { category: rx }, { material: rx }, { colour: rx }];
  }
  if (req.query.isActive === "true" || req.query.isActive === "false") {
    filter.isActive = req.query.isActive === "true";
  }
  if (req.query.category) filter.category = String(req.query.category);

  const sortBy = SORTABLE.includes(req.query.sort) ? req.query.sort : "createdAt";
  const dir = req.query.order === "asc" ? 1 : -1;

  const [data, total] = await Promise.all([
    Product.find(filter).sort({ [sortBy]: dir }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pagination(page, limit, total) });
});

const getSingleProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    if (req.file) removeFile(req.file.filename);
    return res.status(404).json({ message: "Product not found" });
  }

  const oldImage = product.image;
  try {
    product.set(pick(req.body));
    if (req.file) product.image = req.file.filename;
    product.updatedBy = req.user._id;
    await product.save();
  } catch (error) {
    if (req.file) removeFile(req.file.filename);
    throw error;
  }
  if (req.file) removeFile(oldImage); // new image saved, delete the old one

  audit(req.user, "update", "Product", product._id, `Updated product ${product.sku}`);
  res.json({ message: "Product Updated", data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const used =
    (await Order.exists({ "items.product": product._id })) ||
    (await InventoryTransaction.exists({ product: product._id }));

  if (used) {
    product.isActive = false;
    product.updatedBy = req.user._id;
    await product.save();
    audit(req.user, "deactivate", "Product", product._id, `Deactivated product ${product.sku}`);
    return res.json({ message: "Product is used in orders/stock, so it was deactivated instead of deleted" });
  }

  removeFile(product.image);
  await product.deleteOne();
  audit(req.user, "delete", "Product", product._id, `Deleted product ${product.sku}`);
  res.json({ message: "Product Deleted" });
});

module.exports = { createProduct, getProducts, getSingleProduct, updateProduct, deleteProduct };
