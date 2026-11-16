const express = require("express");

const router = express.Router();

const c = require("../controller/orderController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const validateId = require("../middlewares/validateId");

router.post("/", protect, authorizeRoles("admin", "manager", "employee"), c.create);
router.get("/", protect, authorizeRoles("admin", "manager", "employee"), c.list);
router.put("/:id/status", protect, authorizeRoles("admin", "manager", "employee"), validateId, c.changeStatus);
router.get("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, c.getOne);
router.put("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, c.update);
router.delete("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, c.remove);

module.exports = router;
