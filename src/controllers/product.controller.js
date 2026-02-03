const ProductSchema = require("../schemas/Product.schema");
const AppError = require("../utils/app-error.utili");
const catchAsyncUtili = require("../utils/catch-async.utili");
const cache = require("../config/cache.config");
const CategoryProductSchema = require("../schemas/CategoryProduct.schema");

// ✅ 1. إنشاء منتج جديد (Admin)
exports.createProduct = catchAsyncUtili(async (req, res, next) => {
  const { name, description, category, gender, price, variants } = req.body;

  // التحقق من الفئة
  const categoryExists = await CategoryProductSchema.findById(category);
  if (!categoryExists) {
    return next(new AppError("الفئة غير موجودة", 400));
  }

  const product = await ProductSchema.create({
    name,
    description,
    category,
    gender,
    price,
    variants,
    ...req.body,
  });

  // إزالة caches
  cache.del("products:all");
  cache.del(`product:${product.slug}`);

  res.status(201).json({
    success: true,
    data: product,
  });
});

// ✅ 2. جلب كل المنتجات (Public)
exports.getAllProducts = catchAsyncUtili(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    gender,
    category,
    minPrice,
    maxPrice,
    search,
  } = req.query;

  const query = { isActive: true };

  if (gender) query.gender = gender;
  if (category) query.category = category;
  if (minPrice || maxPrice) {
    query["price.final"] = {};
    if (minPrice) query["price.final"].$gte = minPrice;
    if (maxPrice) query["price.final"].$lte = maxPrice;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const cacheKey = `products:${JSON.stringify(req.query)}`;
  let products = cache.get(cacheKey);

  if (!products) {
    [products, totalCount] = await Promise.all([
      ProductSchema.find(query)
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),

      ProductSchema.countDocuments(query),
    ]);

    cache.set(cacheKey, products, 1800); // 30 دقيقة
  }

  res.json({
    success: true,
    count: products.length,
    total: totalCount,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(totalCount / limit),
    },
    data: products,
  });
});

// ✅ 3. جلب منتج واحد (Public)
exports.getProduct = catchAsyncUtili(async (req, res, next) => {
  const { id, slug } = req.params;

  const cacheKey = `product:${slug || id}`;
  let product = cache.get(cacheKey);

  if (!product) {
    product = await ProductSchema.findOne({
      $or: [{ _id: id }, { slug }],
    })
      .populate("category", "name")
      .lean();

    if (!product) {
      return next(new AppError("المنتج غير موجود", 404));
    }

    cache.set(cacheKey, product, 3600);
  }

  res.json({
    success: true,
    data: product,
  });
});

// ✅ 4. تحديث منتج (Admin)
exports.updateProduct = catchAsyncUtili(async (req, res, next) => {
  const product = await ProductSchema.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    },
  ).populate("category");

  if (!product) {
    return next(new AppError("المنتج غير موجود", 404));
  }

  // إزالة caches
  cache.del("products:all");
  cache.del(`product:${product.slug}`);

  res.json({
    success: true,
    data: product,
  });
});

// ✅ 5. حذف منتج (Admin)
exports.deleteProduct = catchAsyncUtili(async (req, res, next) => {
  const product = await ProductSchema.findByIdAndUpdate(
    req.params.id,
    { isActive: false }, // Soft delete
    { new: true },
  );

  if (!product) {
    return next(new AppError("المنتج غير موجود", 404));
  }

  cache.del("products:all");
  cache.del(`product:${product.slug}`);

  res.json({
    success: true,
    message: "تم تعطيل المنتج بنجاح",
  });
});

// ✅ 6. تحديث مخزون (Admin)
exports.updateStock = catchAsyncUtili(async (req, res, next) => {
  const { productId, variantSku, stock } = req.body;

  const product = await ProductSchema.findById(productId);
  if (!product) {
    return next(new AppError("المنتج غير موجود", 404));
  }

  const variantIndex = product.variants.findIndex((v) => v.sku === variantSku);
  if (variantIndex === -1) {
    return next(new AppError("الـ SKU غير موجود", 400));
  }

  product.variants[variantIndex].stock = stock;
  await product.save();

  cache.del(`product:${product.slug}`);
  cache.del("products:all");

  res.json({
    success: true,
    data: product.variants[variantIndex],
  });
});
