const { Schema, default: mongoose } = require("mongoose");

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, required: true, trim: true },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    gender: {
      type: String,
      enum: ["men", "women"],
      required: true,
    },

    price: {
      original: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      final: { type: Number, required: true },
    },

    variants: [
      {
        size: {
          type: String,
          required: true,
          enum: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
        },
        color: {
          name: { type: String, required: true },
          hexCode: { type: String, required: true },
        },
        stock: { type: Number, required: true, min: 0 },
        images: {
          main: { type: String, required: true },
          gallery: [String],
        },
      },
    ],

    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },

    isActive: { type: Boolean, default: true },
    createdProductAt: { type: Date, default: Date.now },
    updatedProductAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", async function (next) {
  // 1. إذا كان slug فارغ أو غير موجود، أنشئه تلقائياً
  if (!this.slug || this.slug.trim() === "") {
    let slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let originalSlug = slug;
    let count = 0;

    // التأكد من التفرد
    while (await this.constructor.findOne({ slug })) {
      count++;
      slug = `${originalSlug}-${count}`;
    }

    this.slug = slug;
  }
  // 2. إذا كان slug موجود، اجعله lowercase ونظيف
  else {
    this.slug = this.slug
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // التأكد من عدم وجود تكرار
    const existing = await this.constructor.findOne({
      slug: this.slug,
      _id: { $ne: this._id },
    });

    if (existing) {
      let originalSlug = this.slug;
      let count = 0;
      while (
        await this.constructor.findOne({ slug: `${originalSlug}-${count}` })
      ) {
        count++;
      }
      this.slug = `${originalSlug}-${count}`;
    }
  }

  next;
});

module.exports = mongoose.model("Product", productSchema);
