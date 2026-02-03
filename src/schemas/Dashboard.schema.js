const { Schema, model } = require("mongoose");

const dashboardSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    stats: {
      totalOrders: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      pendingPayments: { type: Number, default: 0 },
      completedOrders: { type: Number, default: 0 },
      addressesCount: { type: Number, default: 0 },
    },
    charts: {
      ordersThisMonth: { type: Number, default: 0 },
      revenueThisMonth: { type: Number, default: 0 },
      growthRate: { type: Number, default: 0 },
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = model("Dashboard", dashboardSchema);
