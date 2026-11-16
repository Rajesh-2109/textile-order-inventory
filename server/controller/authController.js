const User = require("../Model/User");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");

// Public register ALWAYS creates an "employee" (no access).
// The role from req.body is ignored, so nobody can register as admin.
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ message: "User Already Exist" });

  // password is hashed by the User model (pre-save)
  await User.create({ name, email, password, role: "employee" });

  res.status(201).json({ message: "User Registered. Ask admin to give you a role." });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and Password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

  // same message for both cases, so nobody can find which emails exist
  if (!user) return res.status(404).json({ message: "Please register first" });
  if (!(await user.matchPassword(String(password)))) {
    return res.status(401).json({ message: "Invalid password" });
  }
  if (!user.isActive) {
    return res.status(403).json({ message: "Account is deactivated" });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

  user.password = undefined;
  res.status(200).json({ message: "Login Successful", token, user });
});

const getProfile = (req, res) => {
  res.json({ user: req.user });
};

const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.name) user.name = req.body.name;
  await user.save();
  res.json({ message: "Profile Updated", user });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Current and new password are required" });
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.matchPassword(String(currentPassword)))) {
    return res.status(400).json({ message: "Current password is wrong" });
  }

  user.password = String(newPassword); // hashed by the model
  await user.save();
  res.json({ message: "Password Changed" });
});

module.exports = { registerUser, loginUser, getProfile, updateProfile, changePassword };
