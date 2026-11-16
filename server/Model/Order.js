const mongoose = require("mongoose");

const STATUSES = [
  "Draft",
  "Confirmed",
  "Materials Pending",
  "In Production",
  "Quality Check",
  "Ready to Dispatch",
  "Dispatched",
  "Completed",
  "Cancelled",
];

const itemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },
    lineTotal: {
      type: Number,
      default: 0,
    },
  },
  { _id: true },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: [true, "Buyer is required"],
    },

    buyerPONumber: {
      type: String,
      required: [true, "Buyer PO number is required"],
      trim: true,
    },

    orderDate: {
      type: Date,
      required: true,
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
      uppercase: true,
      trim: true,
    },

    exchangeRateINR: {
      type: Number,
      default: 90,
      min: 0.01,
    },

    totalAmountINR: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: STATUSES,
      default: "Draft",
    },

    items: {
      type: [itemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one item is required",
      },
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    notes: {
      type: String,
      trim: true,
    },

    // Archive fields
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },

    archivedAt: {
      type: Date,
      default: null,
    },

    archivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

// Calculate order totals on the backend
orderSchema.pre("validate", function (next) {
  let total = 0;

  if (this.items && this.items.length > 0) {
    this.items.forEach((item) => {
      item.lineTotal = Math.round(item.quantity * item.unitPrice * 100) / 100;

      total += item.lineTotal;
    });
  }

  this.totalAmount = Math.round(total * 100) / 100;

  this.totalAmountINR =
    Math.round(
      total * (this.currency === "USD" ? this.exchangeRateINR || 90 : 1) * 100,
    ) / 100;

  if (
    this.orderDate &&
    this.deliveryDate &&
    this.deliveryDate < this.orderDate
  ) {
    this.invalidate(
      "deliveryDate",
      "Delivery date cannot be before order date",
    );
  }

  next();
});

orderSchema.index({ status: 1, deliveryDate: 1 });

const Order = mongoose.model("Order", orderSchema);

Order.STATUSES = STATUSES;

module.exports = Order;
