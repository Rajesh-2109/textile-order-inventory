const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    category: {
      type: String,
      enum: [
        "Yarn",
        "Transport",
        "Labour",
        "Knitting",
        "Dyeing",
        "Processing",
        "Finishing",
        "Quality",
        "Packing",
        "Shipment",
        "Other",
      ],
      required: true,
    },

    description: {
      type: String,
    },

    amountINR: {
      type: Number,
      required: true,
      min: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Expense", schema);
