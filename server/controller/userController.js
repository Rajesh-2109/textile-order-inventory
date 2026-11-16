const User = require("../Model/User");
const asyncHandler = require("../utils/asyncHandler");
const audit = require("../utils/audit");
const { escapeRegex, parsePaging, pagination } = require("../utils/query");

const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const [data, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  res.json({ success: true, data, pagination: pagination(page, limit, total) });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const user = await User.create({ name, email, password, role });
  audit(req.user, "create", "User", user._id, `Created user ${user.email} (${user.role})`);
  res.status(201).json({ message: "User Created", data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const { name, role, isActive } = req.body;
  const isSelf = String(user._id) === String(req.user._id);
  if (isSelf && ((role !== undefined && role !== user.role) || isActive === false)) {
    return res.status(400).json({ message: "You cannot change your own role or deactivate yourself" });
  }

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = Boolean(isActive);
  await user.save();

  audit(req.user, "update", "User", user._id, `${user.email}: role=${user.role}, active=${user.isActive}`);
  res.json({ message: "User Updated", data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (String(user._id) === String(req.user._id)) {
    return res.status(400).json({ message: "You cannot delete yourself" });
  }
  await user.deleteOne();
  audit(req.user, "delete", "User", user._id, `Deleted user ${user.email}`);
  res.json({ message: "User Deleted" });
});

module.exports = { getUsers, createUser, updateUser, deleteUser };
