const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: [true, "SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: { type: String, required: [true, "Product name is required"], trim: true },
    category: { type: String, trim: true },
    material: { type: String, trim: true },
    size: { type: String, trim: true },
    colour: { type: String, trim: true },
    unit: {
      type: String,
      enum: { values: ["pcs", "sets", "kg", "m", "cartons"], message: "Invalid unit" },
      default: "pcs",
    },
    reorderLevel: { type: Number, min: [0, "Reorder level cannot be negative"], default: 0 },
    description: { type: String, trim: true },
    image: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
