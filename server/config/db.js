const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URL || !process.env.JWT_SECRET) {
    console.error("MONGO_URL and JWT_SECRET must be set in .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDb Connected....");
  } catch (error) {
    console.error("MongoDb connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
