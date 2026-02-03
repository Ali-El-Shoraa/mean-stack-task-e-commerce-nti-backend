const OrderSchema = require("../schemas/Order.schema");
const PaymentSchema = require("../schemas/Payment.schema");
const AddressSchema = require("../schemas/Address.schema");
const UserSchema = require("../schemas/User.schema");
const catchAsync = require("../utils/catch-async.utili");
const AppError = require("../utils/app-error.utili");

// ✅ 1. User Dashboard
exports.getUserDashboard = catchAsync(async (req, res) => {
  const [
    ordersCount,
    totalSpent,
    pendingPayments,
    completedOrders,
    addressesCount,
    recentOrders,
    monthlyStats,
  ] = await Promise.all([
    // إجمالي الطلبات
    OrderSchema.countDocuments({ user: req.user.id }),
    // إجمالي المصروف
    OrderSchema.aggregate([
      { $match: { user: req.user.id } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    // مدفوعات معلقة
    PaymentSchema.countDocuments({
      user: req.user.id,
      status: "pending",
      paymentMethod: "cod",
    }),
    // طلبات مكتملة
    OrderSchema.countDocuments({
      user: req.user.id,
      status: "delivered",
    }),
    // عدد العناوين
    AddressSchema.countDocuments({
      user: req.user.id,
      isActive: true,
    }),
    // آخر 5 طلبات
    OrderSchema.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("status totalAmount createdAt"),
    // إحصائيات الشهر
    OrderSchema.aggregate([
      {
        $match: {
          user: req.user.id,
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          total: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalOrders: ordersCount,
        totalSpent: totalSpent[0]?.total || 0,
        pendingPayments,
        completedOrders,
        addressesCount,
      },
      charts: {
        ordersThisMonth: monthlyStats[0]?.count || 0,
        revenueThisMonth: monthlyStats[0]?.total || 0,
        growthRate: 12.5, // حساب حقيقي لاحقاً
      },
      recentOrders,
    },
  });
});

// ✅ 2. Admin Dashboard
exports.getAdminDashboard = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalOrders,
    totalRevenue,
    pendingCOD,
    topProducts,
    monthlyRevenue,
  ] = await Promise.all([
    // إجمالي المستخدمين
    UserSchema.countDocuments(),
    // إجمالي الطلبات
    OrderSchema.countDocuments(),
    // إجمالي الإيرادات
    OrderSchema.aggregate([
      { $match: { status: { $in: ["delivered", "confirmed"] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    // COD معلق
    PaymentSchema.countDocuments({
      status: "pending",
      paymentMethod: "cod",
    }),
    // أفضل المنتجات (5)
    OrderSchema.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
    ]),
    // إيرادات الشهر
    OrderSchema.aggregate([
      {
        $match: {
          status: { $in: ["delivered", "confirmed"] },
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingCOD,
        avgOrderValue: totalRevenue[0]?.total / totalOrders || 0,
      },
      charts: {
        monthlyRevenue,
        topProducts,
      },
    },
  });
});
