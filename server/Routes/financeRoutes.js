const router = require("express").Router();
const c = require("../controller/financeController");
const { protect, authorizeRoles } = require("../middlewares/authMiddleware");
router.use(protect, authorizeRoles("admin"));
router.get("/", c.getFinance);
router.put("/exchange-rate", c.updateRate);
router.get("/progress", c.orderProgress);
module.exports = router;
