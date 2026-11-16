const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    buyerCode: {
      type: String,
      required: [true, "Buyer code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    companyName: { type: String, required: [true, "Company name is required"], trim: true },
    contactName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Buyer", buyerSchema);
