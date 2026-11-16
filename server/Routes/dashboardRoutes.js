const express = require("express");

const router = express.Router();

const { summary } = require("../controller/dashboardController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/", protect, authorizeRoles("admin", "manager", "employee"), summary);

module.exports = router;
