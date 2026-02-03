const { Router } = require("express");
const {
  getSiteSettings,
  updateSiteSettings,
  updateLogo,
  updateSocialMedia,
  toggleMaintenance,
} = require("../controllers/settings.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

const router = Router();

// Public route
router.get("/", getSiteSettings);

// Admin routes
router.use(protect, restrictTo("admin"));

router.put("/", updateSiteSettings);
router.put("/logo", updateLogo);
router.put("/social", updateSocialMedia);
router.put("/maintenance", toggleMaintenance);

module.exports = router;
