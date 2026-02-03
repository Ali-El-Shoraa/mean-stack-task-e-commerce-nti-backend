const { faker } = require("@faker-js/faker");
const CategoryProductSchema = require("./src/schemas/CategoryProduct.schema");
const ProductSchema = require("./src/schemas/Product.schema");
const mongoose = require("mongoose");

// دالة مساعدة لتحويل الاسم إلى Slug (نفس منطق السكيمات لديك)
const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, "-");

const seedData = async () => {
  try {
    const MONGODB_URI = "mongodb://localhost:27017/e-commerce-task-nti";
    await mongoose.connect(MONGODB_URI);

    // تنظيف البيانات القديمة
    await ProductSchema.deleteMany({});
    await CategoryProductSchema.deleteMany({});

    // 1. إنشاء الفئات الرئيسية يدوياً مع الـ slug
    const menCat = await CategoryProductSchema.create({
      name: "Men",
      slug: "men",
    });
    const womenCat = await CategoryProductSchema.create({
      name: "Women",
      slug: "women",
    });

    // 2. تحضير الفئات الفرعية مع توليد الـ slug يدوياً
    const subCategoriesData = [
      { name: "Shirts", parent: menCat._id },
      { name: "Pants", parent: menCat._id },
      { name: "Dresses", parent: womenCat._id },
      { name: "Skirts", parent: womenCat._id },
      { name: "Suits", parent: menCat._id },
    ].map((cat) => ({
      ...cat,
      slug: slugify(cat.name), // توليد السلاج يدوياً لتجنب خطأ الـ null
    }));

    // استخدام insertMany الآن سيتم بنجاح لأن السلاج موجود
    const subCategories =
      await CategoryProductSchema.insertMany(subCategoriesData);
    console.log("✅ Categories & Sub-categories created!");

    // 3. إنشاء المنتجات
    const products = [];
    for (let i = 0; i < 40; i++) {
      const selectedSub = faker.helpers.arrayElement(subCategories);
      const productGender =
        selectedSub.parent.toString() === menCat._id.toString()
          ? "men"
          : "women";
      const name = faker.commerce.productName();

      products.push({
        name: name,
        slug: slugify(name) + "-" + faker.string.alphanumeric(5), // ضمان تفرد السلاج
        description: faker.commerce.productDescription(),
        category: selectedSub._id,
        gender: productGender,
        price: {
          original: 1000,
          discount: 10,
          final: 900,
        },
        variants: [
          {
            size: "M",
            color: { name: "Black", hexCode: "#000" },
            stock: 50,
            images: {
              main: faker.image.urlLoremFlickr({ category: "fashion" }),
              gallery: [],
            },
          },
        ],
        isActive: true,
      });
    }

    await ProductSchema.insertMany(products);
    console.log("🚀 Seeding Completed Successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
