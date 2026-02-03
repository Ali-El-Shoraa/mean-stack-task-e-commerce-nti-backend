const { Schema, model } = require("mongoose");

const paymentSchema = new Schema(
  {
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: [true, "المبلغ مطلوب"],
      min: [0, "المبلغ يجب أن يكون أكبر من صفر"],
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "card", "cash"], // COD = دفع عند الاستلام
      default: "cod",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "paid", "failed", "refunded"],
      default: "pending",
    },
    addressUsed: {
      type: Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "الملاحظات طويلة جداً"],
    },
    deliveredBy: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryPerson",
    },
    paidAt: Date,
    confirmedAt: Date,
  },
  { timestamps: true }
);

module.exports = model("Payment", paymentSchema);
