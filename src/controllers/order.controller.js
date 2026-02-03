const { default: mongoose } = require("mongoose");
const CartSchema = require("../schemas/Cart.schema");
const OrderSchema = require("../schemas/Order.schema");
const ProductSchema = require("../schemas/Product.schema");
const catchAsyncUtili = require("../utils/catch-async.utili");

// exports.checkout = catchAsyncUtili(async (req, res, next) => {
//   const session = await mongoose.startSession();

//   try {
//     await session.withTransaction(async () => {
//       // ✅ 1. Copy Cart → Order مباشرة بـ Aggregation (صفر JS)
//       const orderData = await CartSchema.aggregate([
//         { $match: { user: req.user.id, isActive: true } },
//         {
//           $replaceRoot: {
//             newRoot: {
//               user: "$user",
//               items: "$items",
//               totalAmount: "$totalPrice",
//             },
//           },
//         },
//       ]);

//       // إنشاء Order من نتيجة Aggregation مباشرة
//       await OrderSchema.insertMany(orderData, { session });

//       // ✅ 2. Stock Update كامل بـ Pipeline واحد
//       await ProductSchema.updateMany(
//         {}, // كل المنتجات
//         [
//           {
//             $set: {
//               variants: {
//                 $map: {
//                   input: "$variants",
//                   as: "variant",
//                   in: {
//                     $mergeObjects: [
//                       "$$variant",
//                       {
//                         stock: {
//                           $let: {
//                             vars: {
//                               cartItems: {
//                                 $getField: {
//                                   field: "items",
//                                   input: {
//                                     $document: {
//                                       $match: {
//                                         user: req.user.id,
//                                         isActive: true,
//                                       },
//                                     },
//                                   },
//                                 },
//                               },
//                             },
//                             in: {
//                               $max: [
//                                 0,
//                                 {
//                                   $subtract: [
//                                     "$$variant.stock",
//                                     {
//                                       $reduce: {
//                                         input: {
//                                           $filter: {
//                                             input: {
//                                               $arrayElemAt: [
//                                                 "$cartItems.items",
//                                                 {
//                                                   $indexOfArray: [
//                                                     "$cartItems.items.product",
//                                                     "$_id",
//                                                   ],
//                                                 },
//                                               ],
//                                             },
//                                             cond: {
//                                               $eq: [
//                                                 "$$this.variantSku",
//                                                 "$$variant.sku",
//                                               ],
//                                             },
//                                           },
//                                         },
//                                         initialValue: 0,
//                                         in: {
//                                           $add: ["$$value", "$$this.quantity"],
//                                         },
//                                       },
//                                     },
//                                   ],
//                                 },
//                               ],
//                             },
//                           },
//                         },
//                       },
//                     ],
//                   },
//                 },
//               },
//             },
//           },
//         ],
//         { session }
//       );

//       // ✅ 3. Archive Cart
//       await CartSchema.updateOne(
//         { user: req.user.id, isActive: true },
//         {
//           $set: {
//             items: [],
//             totalItems: 0,
//             totalPrice: 0,
//             isActive: false,
//           },
//         },
//         { session }
//       );
//     });

//     res.json({
//       success: true,
//       message: "✅ تم الطلب بنجاح - 100% Database Engine",
//     });
//   } catch (error) {
//     next(new AppError("فشل المعاملة", 500));
//   } finally {
//     session.endSession();
//   }
// });

const checkout = catchAsyncUtili(async (req, res, next) => {
  const session = await mongoose.startSession();
  let createdOrderId = null;

  try {
    await session.withTransaction(async () => {
      // ✅ 1. Copy Cart → Order + حفظ Order ID
      const orderData = await CartSchema.aggregate([
        { $match: { user: req.user.id, isActive: true } },
        {
          $addFields: {
            orderId: { $toString: "$_id" }, // للرجوع لاحقاً
            orderNumber: {
              $concat: [
                "ORD-",
                { $toString: { $toDate: "$$NOW" } },
                "-",
                { $toString: "$user" },
              ],
            },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              user: "$user",
              items: "$items",
              totalAmount: "$totalPrice",
              orderNumber: "$orderNumber",
            },
          },
        },
      ]);

      // ✅ إنشاء Order وحفظ ID
      const orderDoc = await OrderSchema.create(orderData, { session });
      createdOrderId = orderDoc?.[0]?._id; // ✅ Order ID للـ Response

      // ✅ 2. Stock Update (نفس الكود)
      await ProductSchema.updateMany(
        {}, // كل المنتجات
        [
          {
            $set: {
              variants: {
                $map: {
                  input: "$variants",
                  as: "variant",
                  in: {
                    $mergeObjects: [
                      "$$variant",
                      {
                        stock: {
                          $let: {
                            vars: {
                              cartItems: {
                                $getField: {
                                  field: "items",
                                  input: {
                                    $document: {
                                      $match: {
                                        user: req.user.id,
                                        isActive: true,
                                      },
                                    },
                                  },
                                },
                              },
                            },
                            in: {
                              $max: [
                                0,
                                {
                                  $subtract: [
                                    "$$variant.stock",
                                    {
                                      $reduce: {
                                        input: {
                                          $filter: {
                                            input: {
                                              $arrayElemAt: [
                                                "$cartItems.items",
                                                {
                                                  $indexOfArray: [
                                                    "$cartItems.items.product",
                                                    "$_id",
                                                  ],
                                                },
                                              ],
                                            },
                                            cond: {
                                              $eq: [
                                                "$$this.variantSku",
                                                "$$variant.sku",
                                              ],
                                            },
                                          },
                                        },
                                        initialValue: 0,
                                        in: {
                                          $add: ["$$value", "$$this.quantity"],
                                        },
                                      },
                                    },
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        ],
        { session }
      );

      // ✅ 3. Archive Cart
      await CartSchema.updateOne(
        { user: req.user.id, isActive: true },
        {
          $set: {
            items: [],
            totalItems: 0,
            totalPrice: 0,
            isActive: false,
          },
        },
        { session }
      );
    });

    // ✅ جلب بيانات الطلب للـ Response
    const orderDetails = await OrderSchema.findById(createdOrderId)
      .populate("items.product", "name images price category")
      .select("-__v")
      .lean();

    res.json({
      success: true,
      message: "✅ تم الطلب بنجاح",
      data: {
        orderId: createdOrderId,
        orderNumber: orderDetails.orderNumber,
        totalAmount: orderDetails.totalAmount,
        totalItems: orderDetails.items.length,
        items: orderDetails.items.map((item) => ({
          product: {
            id: item.product._id,
            name: item.product.name,
            image: item.product.images?.main,
            category: item.product.category?.name,
          },
          variantSku: item.variantSku,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.quantity * item.price,
        })),
        status: orderDetails.status || "pending",
        createdAt: orderDetails.createdAt,
      },
    });
  } catch (error) {
    next(new AppError(`فشل المعاملة: ${error.message}`, 500));
  } finally {
    session.endSession();
  }
});
module.exports = { checkout };
