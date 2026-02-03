const { model, Schema } = require("mongoose");

// models/Order.schema.js
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantSku: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // ✅ سعر وقت الشراء
  currentPrice: { type: Number }, // ✅ السعر الحالي (للمقارنة)
});

const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = model("Order", orderSchema);

// const { Schema, model } = require("mongoose");

// // schemas/Order.schema.js
// const orderSchema = new Schema(
//   {
//     user: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     items: [
//       {
//         product: {
//           type: Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         quantity: { type: Number, required: true },
//         price: { type: Number, required: true },
//       },
//     ],
//     totalAmount: Number,
//     status: {
//       type: String,
//       enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
//       default: "pending",
//     },
//     orderedAt: {
//       type: Date,
//       defualt: Date.now,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = model("Order", orderSchema);
