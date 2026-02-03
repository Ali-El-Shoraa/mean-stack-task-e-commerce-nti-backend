const WishlistSchema = require("../schemas/Wishlist.schema");
const ProductSchema = require("../schemas/Product.schema");
const AppError = require("../utils/app-error.utili");
const catchAsync = require("../utils/catch-async.utili");

const createWishlistHandler = (action) => {
  return catchAsync(async (req, res, next) => {
    const { productId } = req.body;

    // التحقق من وجود المنتج
    const product = await ProductSchema.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return next(new AppError("المنتج غير متوفر", 404));
    }

    // جلب أو إنشاء Wishlist
    let wishlist = await WishlistSchema.findOne({
      user: req.user.id,
      isActive: true,
    });

    if (!wishlist) {
      if (action === "REMOVE") {
        return next(new AppError("قائمة المفضلة فارغة", 404));
      }

      // إنشاء wishlist جديدة للـ ADD
      wishlist = await WishlistSchema.create({
        user: req.user.id,
        items: [{ product: productId, variantSku }],
      });
    } else {
      // منطق الـ ADD أو REMOVE حسب الـ action
      if (action === "ADD") {
        const exists = wishlist.items.find(
          (item) =>
            item.product.toString() === productId &&
            item.variantSku === variantSku
        );

        if (exists) {
          return next(
            new AppError("المنتج موجود بالفعل في قائمة المفضلة", 409)
          );
        }

        wishlist.items.push({ product: productId, variantSku });
      } else if (action === "REMOVE") {
        const initialCount = wishlist.items.length;
        wishlist.items = wishlist.items.filter(
          (item) =>
            !(
              item.product.toString() === productId &&
              item.variantSku === variantSku
            )
        );

        if (wishlist.items.length === initialCount) {
          return next(new AppError("المنتج غير موجود في قائمة المفضلة", 404));
        }
      }
    }

    await wishlist.save();

    // Response حسب الـ action
    const statusCode = action === "ADD" ? 201 : 200;
    const message =
      action === "ADD"
        ? "تم إضافة المنتج لقائمة المفضلة بنجاح"
        : "تم حذف المنتج من قائمة المفضلة";

    res.status(statusCode).json({
      success: true,
      message,
      action,
      data: {
        wishlistId: wishlist._id,
        totalItems: wishlist.totalItems,
      },
    });
  });
};

// ✅ Export handlers باستخدام Factory
exports.addToWishlist = createWishlistHandler("ADD");
exports.removeFromWishlist = createWishlistHandler("REMOVE");

// ✅ 2. جلب قائمة المفضلة
exports.getWishlist = catchAsync(async (req, res, next) => {
  const wishlist = await WishlistSchema.findOne({ user: req.user.id }).populate(
    {
      path: "items.product",
      select: "name slug price images category variants",
      match: { isActive: true },
      populate: {
        path: "category",
        select: "name",
      },
    }
  );

  res.json({
    success: true,
    data: wishlist || { items: [], totalItems: 0 },
  });
});

// ✅ 4. حذف كل الـ Wishlist
exports.clearWishlist = catchAsync(async (req, res, next) => {
  await WishlistSchema.findOneAndUpdate(
    { user: req.user.id },
    { items: [], totalItems: 0 }
  );

  res.json({
    success: true,
    message: "تم تفريغ قائمة المفضلة",
  });
});
