require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./Model/User");
const Buyer = require("./Model/Buyer");
const Product = require("./Model/Product");

const users = [
  { name: "Admin", email: "admin@toims.com", password: "Admin@123", role: "admin" },
  { name: "Manager", email: "manager@toims.com", password: "Manager@123", role: "manager" },
  { name: "Employee", email: "employee@toims.com", password: "Employee@123", role: "employee" },
];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    for (const u of users) {
      if (!(await User.findOne({ email: u.email }))) {
        await User.create(u);
        console.log("Created user:", u.email);
      }
    }
    if (!(await Buyer.findOne({ buyerCode: "BUY001" }))) {
      await Buyer.create({ buyerCode: "BUY001", companyName: "Home Comfort Textiles", contactName: "Rahul", email: "rahul@example.com", phone: "9000000001" });
      console.log("Created sample buyer");
    }
    if (!(await Product.findOne({ sku: "TWL-001" }))) {
      await Product.create([
        { sku: "TWL-001", name: "Cotton Bath Towel", category: "Towels", material: "Cotton", size: "70x140", colour: "White", unit: "pcs", reorderLevel: 100 },
        { sku: "BDS-001", name: "Bed Sheet Set", category: "Bedding", material: "Cotton", size: "King", colour: "Blue", unit: "sets", reorderLevel: 50 },
      ]);
      console.log("Created sample products");
    }
    console.log("Seed finished");
  } catch (e) {
    console.error("Seed failed:", e.message);
  } finally {
    await mongoose.disconnect();
  }
})();
