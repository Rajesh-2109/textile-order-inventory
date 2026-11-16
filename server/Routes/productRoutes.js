const express = require("express");

const router = express.Router();

const {
  createProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("../controller/productController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
const validateId = require("../middlewares/validateId");
const upload = require("../middlewares/uploadMiddleware");

router.post("/", protect, authorizeRoles("admin", "manager", "employee"), upload.single("image"), createProduct);
router.get("/", protect, authorizeRoles("admin", "manager", "employee"), getProducts);
router.get("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, getSingleProduct);
router.put("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, upload.single("image"), updateProduct);
router.delete("/:id", protect, authorizeRoles("admin", "manager", "employee"), validateId, deleteProduct);

module.exports = router;
