const { Router } = require("express");
const router = Router();
const { protect } = require("../middlewares/auth.middleware");

const {
  register,
  login,
  getMe,
  updateProfile,
  requestPasswordOTP,
  changePassword,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.use(protect);

// router.get("/me", getMe);
router.put("/update-profile", updateProfile);
router.post("/request-password-otp", requestPasswordOTP);
router.put("/change-password", changePassword);

module.exports = router;
