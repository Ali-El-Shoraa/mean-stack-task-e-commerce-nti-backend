const PaymentSchema = require("../schemas/Payment.schema");
const OrderSchema = require("../schemas/Order.schema");
const AddressSchema = require("../schemas/Address.schema");
const catchAsync = require("../utils/catch-async.utili");
const AppError = require("../utils/app-error.utili");

// ✅ 1. إنشاء دفع عند الاستلام (COD)
exports.createCODPayment = catchAsync(async (req, res, next) => {
  const { orderId, addressId, notes } = req.body;

  // التحقق من الطلب
  const order = await OrderSchema.findOne({
    _id: orderId,
    user: req.user.id,
    status: { $nin: ["delivered", "cancelled"] },
  });

  if (!order) {
    return next(new AppError("الطلب غير موجود أو تم تسليمه", 404));
  }

  // التحقق من العنوان
  const address = await AddressSchema.findOne({
    _id: addressId,
    user: req.user.id,
    isActive: true,
  });

  if (!address) {
    return next(new AppError("العنوان غير موجود", 404));
  }

  // إنشاء الدفعة
  const payment = await PaymentSchema.create({
    order: orderId,
    user: req.user.id,
    amount: order.totalAmount,
    paymentMethod: "cod",
    addressUsed: addressId,
    notes,
  });

  // تحديث حالة الطلب
  order.status = "confirmed";
  order.paymentStatus = "pending";
  await order.save();

  res.status(201).json({
    success: true,
    message: "تم إنشاء طلب الدفع عند الاستلام بنجاح",
    data: {
      paymentId: payment._id,
      orderId: order._id,
      amount: payment.amount,
      status: payment.status,
      deliveryAddress: {
        name: address.name,
        phones: address.phones,
        city: address.city,
        area: address.area,
      },
    },
  });
});

// ✅ 2. حالة الدفع
exports.getPaymentStatus = catchAsync(async (req, res, next) => {
  const payment = await PaymentSchema.findOne({
    _id: req.params.paymentId,
    user: req.user.id,
  })
    .populate("order", "status totalAmount items")
    .populate("addressUsed", "name city area phones");

  if (!payment) {
    return next(new AppError("الدفعة غير موجودة", 404));
  }

  res.json({
    success: true,
    data: {
      paymentId: payment._id,
      status: payment.status,
      method: payment.paymentMethod,
      amount: payment.amount,
      orderStatus: payment.order.status,
      deliveryAddress: payment.addressUsed,
    },
  });
});

// ✅ 3. قائمة مدفوعات المستخدم
exports.getUserPayments = catchAsync(async (req, res) => {
  const payments = await PaymentSchema.find({ user: req.user.id })
    .populate("order", "status totalAmount createdAt")
    .populate("addressUsed", "city area")
    .sort({ createdAt: -1 })
    .limit(10);

  res.json({
    success: true,
    data: {
      payments,
      count: payments.length,
    },
  });
});
