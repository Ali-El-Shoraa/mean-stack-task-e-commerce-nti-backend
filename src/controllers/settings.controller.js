const catchAsync = require("../utils/catch-async.utili");
const cache = require("../config/cache.config");
const logger = require("../config/logger.config");
const SiteSettingSchema = require("../schemas/SiteSetting.schema");

// @desc    Get site settings
// @route   GET /api/settings
// @access  Public
const getSiteSettings = catchAsync(async (req, res, next) => {
  // ✅ Check cache first
  const cachedSettings = cache.get("site:settings");

  if (cachedSettings) {
    return res.json({
      success: true,
      data: cachedSettings,
    });
  }

  const settings = await SiteSettingSchema.getSiteSettings();

  // تحويله لكائن بسيط قبل الكاش
  const settingsPlain = settings.toObject();

  // Cache for 1 hour
  cache.set("site:settings", settingsPlain, 3600);

  res.json({
    success: true,
    data: settingsPlain,
  });
});

// @desc    Update site settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSiteSettings = catchAsync(async (req, res, next) => {
  const updates = req.body;
  // const {} = req.body;
  // ✅ منع تعديل بعض الحقول
  //   delete updates._id;
  //   delete updates.createdAt;

  let settings = await SiteSettingSchema.findOne();

  if (!settings) {
    settings = await SiteSettingSchema.create(updates);
  } else {
    // Update nested objects
    Object.keys(updates).forEach((key) => {
      if (typeof updates[key] === "object" && !Array.isArray(updates[key])) {
        settings[key] = { ...settings[key], ...updates[key] };
      } else {
        settings[key] = updates[key];
      }
    });

    await settings.save();
  }

  // Clear cache
  cache.del("site:settings");

  logger.info(`Site settings updated by admin: ${req.user.email}`);

  res.json({
    success: true,
    message: "تم تحديث إعدادات الموقع بنجاح",
    data: settings,
  });
});

// @desc    Update logo only
// @route   PUT /api/settings/logo
// @access  Private/Admin
const updateLogo = catchAsync(async (req, res, next) => {
  const { main, favicon, footerLogo } = req.body;

  const settings = await SiteSettingSchema.getSiteSettings();

  if (main) settings.logo.main = main;
  if (favicon) settings.logo.favicon = favicon;
  if (footerLogo) settings.logo.footerLogo = footerLogo;

  await settings.save();

  cache.del("site:settings");

  res.json({
    success: true,
    message: "تم تحديث اللوجو بنجاح",
    data: settings.logo,
  });
});

// @desc    Update social media links
// @route   PUT /api/settings/social
// @access  Private/Admin
const updateSocialMedia = catchAsync(async (req, res, next) => {
  const socialLinks = req.body;

  const settings = await SiteSettingSchema.getSiteSettings();

  settings.socialMedia = { ...settings.socialMedia, ...socialLinks };
  await settings.save();

  cache.del("site:settings");

  res.json({
    success: true,
    message: "تم تحديث وسائل التواصل بنجاح",
    data: settings.socialMedia,
  });
});

// @desc    Toggle maintenance mode
// @route   PUT /api/settings/maintenance
// @access  Private/Admin
const toggleMaintenance = catchAsync(async (req, res, next) => {
  const { enabled } = req.body;

  const settings = await SiteSettingSchema.getSiteSettings();
  settings.isMaintenance = enabled;
  await settings.save();

  cache.del("site:settings");

  logger.warn(
    `Maintenance mode ${enabled ? "enabled" : "disabled"} by ${req.user.email}`,
  );

  res.json({
    success: true,
    message: `تم ${enabled ? "تفعيل" : "إلغاء"} وضع الصيانة`,
    data: { isMaintenance: settings.isMaintenance },
  });
});

module.exports = {
  toggleMaintenance,
  getSiteSettings,
  updateSiteSettings,
  updateLogo,
  updateSocialMedia,
};
