const express = require("express");

require("dotenv").config();

const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./Routes/authRoutes");
const userRoutes = require("./Routes/userRoutes");
const buyerRoutes = require("./Routes/buyerRoutes");
const productRoutes = require("./Routes/productRoutes");
const orderRoutes = require("./Routes/orderRoutes");
const inventoryRoutes = require("./Routes/inventoryRoutes");
const dashboardRoutes = require("./Routes/dashboardRoutes");
const auditRoutes = require("./Routes/auditRoutes");
const processRoutes = require("./Routes/processRoutes");
const financeRoutes = require("./Routes/financeRoutes");

const { notFound, errorHandler } = require("./middlewares/errorMiddleware");

const dns = require("dns");

dns.setServers(["8.8.8.8"]);

const app = express();
connectDB();

// images from /uploads must be loadable by the React app (different port)
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));

app.use(express.json({ limit: "1mb" }));

// stop password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/buyers", buyerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/processes", processRoutes);
app.use("/api/admin/finance", financeRoutes);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on PORT : ${PORT}`);
});
