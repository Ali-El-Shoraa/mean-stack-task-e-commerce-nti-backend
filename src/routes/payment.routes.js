const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const paymentController = require("../controllers/payment.controller");

router.use(protect);

// ✅ إنشاء دفعة عند الاستلام
router.post("/cod", paymentController.createCODPayment);

// ✅ حالة الدفع
router.get("/status/:paymentId", paymentController.getPaymentStatus);

// ✅ قائمة المدفوعات
router.get("/", paymentController.getUserPayments);

module.exports = router;
