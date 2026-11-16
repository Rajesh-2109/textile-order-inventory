const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: [
        "Yarn Purchase",
        "Yarn Inward",
        "Knitting",
        "Grey Fabric",
        "Dyeing",
        "Printing",
        "Washing",
        "Compacting",
        "Finishing",
        "Quality Inspection",
        "Packing",
        "Shipment",
      ],
      required: true,
    },
    plannedQty: { type: Number, required: true, min: 0 },
    completedQty: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "meter" },
    plannedCostINR: { type: Number, default: 0, min: 0 },
    actualCostINR: { type: Number, default: 0, min: 0 },
    vendor: { type: String, trim: true },
    startDate: Date,
    targetDate: Date,
    notes: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
schema.pre("validate", function (next) {
  if (this.completedQty > this.plannedQty)
    this.invalidate(
      "completedQty",
      "Completed quantity cannot exceed planned quantity",
    );
  next();
});
schema.index({ order: 1, stage: 1 }, { unique: true });
module.exports = mongoose.model("TextileProcess", schema);
