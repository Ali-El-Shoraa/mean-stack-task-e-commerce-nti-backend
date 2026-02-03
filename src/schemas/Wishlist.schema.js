const { Schema, model } = require("mongoose");

const wishlistItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "معرف المنتج مطلوب"],
      index: true,
    },
    // variantSku: {
    //   type: String,
    //   required: [true, "SKU المقاس/اللون مطلوب"],
    //   trim: true,
    //   maxlength: [20, "SKU طويل جداً"],
    //   index: true,
    // },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const wishlistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "المستخدم مطلوب"],
      unique: true, // كل مستخدم wishlist واحدة
      index: true,
    },
    items: [wishlistItemSchema],
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Virtual للتحقق التلقائي
// wishlistSchema.pre("save", function (next) {
//   this.totalItems = this.items.length;
//   next;
// });

module.exports = model("Wishlist", wishlistSchema);
