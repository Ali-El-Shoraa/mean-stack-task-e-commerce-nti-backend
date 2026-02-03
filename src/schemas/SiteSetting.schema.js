const { Schema, model } = require("mongoose");

const siteSettingSchema = new Schema(
  {
    // معلومات الموقع الأساسية
    siteName: {
      type: String,
      required: true,
      default: "Casual Store",
    },
    siteDescription: {
      type: String,
      default: "متجر الملابس الكاجوال للرجال والسيدات",
    },

    // اللوجو
    logo: {
      main: { type: String, required: true },
      favicon: { type: String },
      footerLogo: { type: String },
    },

    // معلومات الاتصال
    contact: {
      email: {
        type: String,
        match: [/^\S+@\S+\.\S+$/, "بريد إلكتروني غير صحيح"],
      },
      phone: { type: String },
      whatsapp: { type: String },
      address: {
        street: { type: String },
        city: { type: String },
        country: { type: String, default: "مصر" },
        // zipCode: { type: String },
      },
    },

    // وسائل التواصل الاجتماعي
    socialMedia: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      twitter: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      youtube: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      snapchat: { type: String, trim: true },
    },

    // ساعات العمل
    workingHours: {
      enabled: { type: Boolean, default: true },
      schedule: {
        type: String,
        default: "السبت - الخميس: 10:00 ص - 10:00 م",
      },
    },

    // SEO
    seo: {
      keywords: [String],
      metaDescription: { type: String },
      ogImage: { type: String }, // Open Graph Image
    },

    // إعدادات إضافية
    currency: {
      code: { type: String, default: "EGP" },
      symbol: { type: String, default: "ج.م" },
    },
    // language: {
    //   type: String,
    //   enum: ["ar", "en"],
    //   default: "ar",
    // },

    // التحكم
    isActive: { type: Boolean, default: true },
    isMaintenance: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// // ✅ يجب أن يكون هناك سجل واحد فقط
siteSettingSchema.statics.getSiteSettings = async function () {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({
      siteName: "Casual Store",
      logo: {
        main: "/uploads/logo.png",
      },
    });
  }

  return settings;
};

module.exports = model("SiteSetting", siteSettingSchema);
