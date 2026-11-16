const express = require("express");

const router = express.Router();

const c = require("../controller/inventoryController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");

// Stock ledger: read or add only. No edit / delete routes on purpose.
router.get("/stock", protect, authorizeRoles("admin", "manager", "employee"), c.stock);
router.get("/transactions", protect, authorizeRoles("admin", "manager", "employee"), c.listTransactions);
router.post("/transactions", protect, authorizeRoles("admin", "manager", "employee"), c.createTransaction);

module.exports = router;
