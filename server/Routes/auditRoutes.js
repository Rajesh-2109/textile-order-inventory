const express = require("express");

const router = express.Router();

const { list } = require("../controller/auditController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

router.get("/", protect, authorizeRoles("admin"), list);

module.exports = router;
