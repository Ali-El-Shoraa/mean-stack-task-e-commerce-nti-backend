const { Schema, model } = require("mongoose");

// const cartItemSchema = new Schema(
//   {
//     product: {
//       type: Schema.Types.ObjectId,
//       ref: "Product",
//       required: [true, "معرف المنتج مطلوب"],
//       index: true,
//     },
//     // variantSku: {
//     //   type: String,
//     //   required: [true, "SKU المقاس/اللون مطلوب"],
//     //   trim: true,
//     //   maxlength: [20, "SKU طويل جداً"],
//     // },
//     quantity: {
//       type: Number,
//       required: [true, "الكمية مطلوبة"],
//       min: [1, "الكمية لا يمكن أن تقل عن 1"],
//       max: [99, "الحد الأقصى 99"],
//       default: 1,
//     },
//     price: {
//       type: Number,
//       required: [true, "السعر مطلوب"],
//       min: [0, "السعر لا يمكن أن يكون سالب"],
//     },
//   }
//   //   {
//   //     _id: false, // لا _id للعناصر الفرعية
//   //     id: false, // لا virtual id
//   //   }
// );

const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "معرف المنتج مطلوب"],
      index: true,
    },
    variantSku: {
      // ✅ أعد إضافتها!
      type: String,
      required: [true, "SKU المقاس/اللون مطلوب"],
      trim: true,
      maxlength: [20, "SKU طويل جداً"],
    },
    quantity: {
      type: Number,
      required: [true, "الكمية مطلوبة"],
      min: [1, "الكمية لا يمكن أن تقل عن 1"],
      max: [99, "الحد الأقصى 99"],
    },
    price: {
      // ✅ سعر snapshot - ثابت!
      type: Number,
      required: [true, "السعر مطلوب"],
      min: [0, "السعر لا يمكن أن يكون سالب"],
    },
  },
  {
    _id: false,
    id: false,
  }
);

const cartSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "المستخدم مطلوب"],
      unique: true, // ✅ كل مستخدم سلة واحدة
      index: true,
    },
    items: [cartItemSchema],
    totalItems: {
      // ✅ العدد الإجمالي
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      // ✅ السعر الإجمالي
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      // ✅ للـ abandoned carts
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Virtual للتحقق التلقائي
cartSchema.pre("save", function (next) {
  // حساب الإجمالي تلقائياً
  this.totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  );

  next;
});

// ✅ Method لتنظيف السلة
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.totalItems = 0;
  this.totalPrice = 0;
  this.isActive = false;
  return this.save();
};

module.exports = model("Cart", cartSchema);
