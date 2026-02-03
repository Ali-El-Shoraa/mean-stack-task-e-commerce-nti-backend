const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const profileController = require("../controllers/profile.controller");
const { createCODPayment } = require("../controllers/payment.controller");

router.use(protect);

// ✅ Profile الأساسي
router.get("/", profileController.getProfile);
router.patch("/me", profileController.updateMe); // /me أقصر من /update-me

// ✅ Addresses - مجموعة كاملة
router
  .route("/addresses")
  .post(profileController.addAddress)
  .get(profileController.getAddresses);

router
  .route("/addresses/:id")
  .patch(profileController.updateAddress)
  .delete(profileController.deleteAddress);

router.patch("/addresses/:id/default", profileController.setDefaultAddress); // أقصر

// أضف هذا للـ profile routes
router.post("/payment/cod", createCODPayment);

module.exports = router;

// const express = require("express");
// const { protect } = require("../middlewares/auth.middleware");
// const {
//   getProfile,
//   updateProfile,
// } = require("../controllers/profile.controller");

// const router = express.Router();
// router.use(protect);

// router.route("/").get(getProfile).patch(updateProfile); // ✅ 2 APIs فقط!

// module.exports = router;

// // const express = require("express");
// // const { protect } = require("../middlewares/auth.middleware");
// // const {
// //   getProfile,
// //   updateProfile,
// // } = require("../controllers/profile.controller");

// // const router = express.Router();
// // router.use(protect);

// // // ✅ API واحدة كاملة!
// // router.route("/").get(getProfile).put(updateProfile);

// // module.exports = router;
