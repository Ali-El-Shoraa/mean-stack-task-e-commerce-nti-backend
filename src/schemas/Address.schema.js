const { Schema, model } = require("mongoose");

const addressSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "اسم المستلم مطلوب"],
      trim: true,
      maxlength: [100, "الاسم طويل جداً"],
    },
    street: {
      type: String,
      required: [true, "العنوان مطلوب"],
      trim: true,
      maxlength: [200, "العنوان طويل جداً"],
    },
    city: {
      type: String,
      required: [true, "المدينة مطلوبة"],
      trim: true,
    },
    area: {
      type: String,
      required: [true, "المنطقة مطلوبة"],
      trim: true,
    },
    postalCode: String,
    country: {
      type: String,
      default: "مصر",
      required: true,
    },
    type: {
      type: String,
      enum: ["home", "work", "office", "other"],
      default: "home",
      required: true,
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// addressSchema.index({ user: 1, isDefault: 1 });
// addressSchema.index({ user: 1, isActive: 1 });

module.exports = model("Address", addressSchema);
