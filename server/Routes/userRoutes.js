const express = require("express");

const router = express.Router();

const { getUsers, createUser, updateUser, deleteUser } = require("../controller/userController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const validateId = require("../middlewares/validateId");

// Users & roles: admin only
router.get("/", protect, authorizeRoles("admin"), getUsers);
router.post("/", protect, authorizeRoles("admin"), createUser);
router.put("/:id", protect, authorizeRoles("admin"), validateId, updateUser);
router.delete("/:id", protect, authorizeRoles("admin"), validateId, deleteUser);

module.exports = router;
