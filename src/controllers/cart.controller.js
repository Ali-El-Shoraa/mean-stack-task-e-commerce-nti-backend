const ProductSchema = require("../schemas/Product.schema");
const catchAsyncUtili = require("../utils/catch-async.utili");

const addToCart = catchAsyncUtili(async (req, res, next) => {
  const { productId, variantSku, quantity = 1, price } = req.body;

  // ✅ جلب السعر الحالي للحفظ
  const product = await ProductSchema.findById(productId);
  const variant = product.variants.find((v) => v.sku === variantSku);

  const snapshotPrice = price || variant.price; // Frontend أو Backend

  // ✅ حفظ السعر وقت الإضافة
  const cartItem = {
    product: productId,
    variantSku,
    quantity,
    price: snapshotPrice, // ✅ ثابت الآن!
  };

  // إضافة للسلة...
  res.json({ success: true, data: cartItem });
});

module.exports = { addToCart };
