// const Product = require("../schemas/Product.schema");
// const AppError = require("../utils/app-error.utili");
const Order = require("../schemas/Order.schema");
const catchAsync = require("../utils/catch-async.utili");
const cache = require("../config/cache.config");

// @desc    Top sellers حسب الفئة (مرن)
// @route   GET /api/top-sellers/:gender
// @access  Public
exports.getTopSellersByGender = catchAsync(async (req, res, next) => {
  //   const { gender } = req.params; // 'men' أو 'women'
  //   const { limit = 5 } = req.query;
  const { gender } = req.query;
  const limit = 5;

  //   const cacheKey = `top:sellers:${gender}:${limit}`;
  //   const cached = cache.get(cacheKey);

  //   if (cached) {
  //     return res.json({
  //       success: true,
  //       data: cached,
  //     });
  //   }

  const topSellers = await Order.aggregate([
    { $unwind: "$items" },
    {
      $match: {
        status: { $in: ["delivered", "confirmed"] },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "items.product",
        foreignField: "_id",
        as: "productDetails",
        let: { gender },
        pipeline: [
          {
            $match: { $expr: { $eq: ["$gender", "$$gender"] }, isActive: true },
          },
          {
            $project: {
              name: 1,
              slug: 1,
              gender: 1,
              images: { main: 1 },
              price: { final: 1 },
              variants: 1,
              rating: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: "$items.product",
        product: { $first: "$productDetails" },
        totalSold: { $sum: "$items.quantity" },
        totalRevenue: {
          $sum: { $multiply: ["$items.quantity", "$items.price"] },
        },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: "orders",
        let: { productId: "$_id" },
        pipeline: [
          { $unwind: "$items" },
          { $match: { $expr: { $eq: ["$items.product", "$$productId"] } } },
          { $count: "orders" },
        ],
        as: "orderStats",
      },
    },
    {
      $addFields: {
        ordersCount: { $size: "$orderStats" },
        rank: { $add: [{ $indexOfArray: [null, null] }, 1] },
      },
    },
  ]);

  //   cache.set(cacheKey, topSellers, 1800);

  res.json({
    success: true,
    data: topSellers,
    filters: { gender, limit: parseInt(limit) },
  });
});
