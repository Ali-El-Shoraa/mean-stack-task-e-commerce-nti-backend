const { default: mongoose, Schema } = require("mongoose");

const categoryProductSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    // required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  // الربط بالفئة الأم (مثل Men أو Women)
  parent: {
    type: Schema.Types.ObjectId,
    ref: "Category",
    default: null,
  },

  sortOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

categoryProductSchema.pre("save", async function (next) {
  if (this.isNew || this.isModified("name")) {
    let slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let originalSlug = slug;
    let count = 0;
    while (await this.constructor.findOne({ slug })) {
      count++;
      slug = `${originalSlug}-${count}`;
    }
    this.slug = slug;
  }
  next;
});

module.exports = mongoose.model("Category", categoryProductSchema);
