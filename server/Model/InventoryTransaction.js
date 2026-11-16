const mongoose = require("mongoose");

// Stock ledger: records are only ever added, never edited or deleted.
const txSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    type: {
      type: String,
      enum: { values: ["IN", "OUT", "ADJUST"], message: "Type must be IN, OUT or ADJUST" },
      required: true,
    },
    quantity: { type: Number, required: [true, "Quantity is required"] },
    signedQty: { type: Number },
    location: { type: String, default: "Main", trim: true },
    reason: { type: String, required: [true, "Reason is required"], trim: true },
    reference: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

txSchema.pre("validate", function (next) {
  const q = this.quantity;
  if (typeof q !== "number" || Number.isNaN(q) || q === 0) {
    this.invalidate("quantity", "Quantity must be a non-zero number");
  } else if (this.type !== "ADJUST" && q < 0) {
    this.invalidate("quantity", "Quantity must be positive for IN / OUT");
  }
  this.signedQty = this.type === "OUT" ? -q : q;
  next();
});

txSchema.index({ product: 1, location: 1 });

module.exports = mongoose.model("InventoryTransaction", txSchema);
