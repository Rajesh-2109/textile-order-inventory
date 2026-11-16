const express = require("express");

const router = express.Router();

const {
  createBuyer,
  getBuyers,
  getSingleBuyer,
  updateBuyer,
  deleteBuyer,
} = require("../controller/buyerController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const validateId = require("../middlewares/validateId");

// admin -> everything | manager -> read, update, delete | employee -> read only
router.post("/", protect, authorizeRoles("admin", "manager", "employee"), createBuyer);
router.get("/", protect, authorizeRoles("admin", "manager", "employee"), getBuyers);
router.get("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, getSingleBuyer);
router.put("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, updateBuyer);
router.delete("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, deleteBuyer);

module.exports = router;
