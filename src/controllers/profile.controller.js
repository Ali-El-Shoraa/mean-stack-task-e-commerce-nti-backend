const UserSchema = require("../schemas/User.schema");
const AddressSchema = require("../schemas/Address.schema");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catch-async.utili");
const AppError = require("../utils/app-error.utili");

// ✅ 1. Profile كامل (User + Addresses)
exports.getProfile = catchAsync(async (req, res) => {
  const [user, addresses] = await Promise.all([
    UserSchema.findById(req.user.id).select("-password"),
    AddressSchema.find({ user: req.user.id, isActive: true }).sort({
      isDefault: -1,
      createdAt: -1,
    }),
  ]);

  res.json({
    success: true,
    data: {
      profile: user,
      addresses,
    },
  });
});

// ✅ 2. تحديث البيانات الأساسية فقط
exports.updateMe = catchAsync(async (req, res, next) => {
  const filteredBody = {};
  ["firstName", "lastName", "phone"].forEach((el) => {
    if (req.body[el] !== undefined) filteredBody[el] = req.body[el];
  });

  if (Object.keys(filteredBody).length === 0) {
    return next(new AppError("لا توجد بيانات للتحديث", 400));
  }

  const updatedUser = await UserSchema.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    { new: true, runValidators: true }
  ).select("-password");

  res.json({
    success: true,
    data: updatedUser,
  });
});

// ✅ 3. إضافة عنوان (مع default logic)
exports.addAddress = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (req.body.isDefault) {
        await AddressSchema.updateMany(
          { user: req.user.id },
          { isDefault: false },
          { session }
        );
      }

      const newAddress = await AddressSchema.create(
        [{ ...req.body, user: req.user.id }],
        { session }
      );

      res.status(201).json({
        success: true,
        data: newAddress[0],
      });
    });
  } finally {
    session.endSession();
  }
});

// ✅ 4. تحديث عنوان معين (مفقود في الكود الأصلي)
exports.updateAddress = catchAsync(async (req, res, next) => {
  const address = await AddressSchema.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!address) {
    return next(new AppError("العنوان غير موجود", 404));
  }

  res.json({
    success: true,
    data: address,
  });
});

// ✅ 5. حذف عنوان (Soft Delete)
exports.deleteAddress = catchAsync(async (req, res, next) => {
  const address = await AddressSchema.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isActive: false },
    { new: true }
  );

  if (!address) {
    return next(new AppError("العنوان غير موجود", 404));
  }

  res.json({
    success: true,
    message: "تم حذف العنوان بنجاح",
  });
});

// ✅ 6. جعل عنوان default
exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      await AddressSchema.updateMany(
        { user: req.user.id },
        { isDefault: false },
        { session }
      );

      const address = await AddressSchema.findOneAndUpdate(
        { _id: req.params.id, user: req.user.id },
        { isDefault: true },
        { new: true, session }
      );

      if (!address) {
        throw new AppError("العنوان غير موجود", 404);
      }

      res.json({
        success: true,
        data: address,
      });
    });
  } finally {
    session.endSession();
  }
});

// ✅ 7. العناوين فقط
exports.getAddresses = catchAsync(async (req, res) => {
  const addresses = await AddressSchema.find({
    user: req.user.id,
    isActive: true,
  }).sort({ isDefault: -1, createdAt: -1 });

  res.json({
    success: true,
    data: addresses,
  });
});

// const UserSchema = require("../schemas/User.schema");
// const AddressSchema = require("../schemas/Address.schema");
// const mongoose = require("mongoose");
// const catchAsync = require("../utils/catch-async.utili");
// const AppError = require("../utils/app-error.utili");

// // ✅ 1. جلب بيانات البروفايل كاملة
// exports.getProfile = catchAsync(async (req, res, next) => {
//   const [user, addresses] = await Promise.all([
//     UserSchema.findById(req.user.id).select("-password"),
//     AddressSchema.find({ user: req.user.id, isActive: true }).sort({
//       isDefault: -1,
//     }),
//   ]);

//   res.json({
//     success: true,
//     data: { user, addresses },
//   });
// });

// // ✅ 2. تحديث البيانات الأساسية فقط
// exports.updateMe = catchAsync(async (req, res, next) => {
//   const filteredBody = {};
//   ["firstName", "lastName", "phone"].forEach((el) => {
//     if (req.body[el]) filteredBody[el] = req.body[el];
//   });

//   const updatedUser = await UserSchema.findByIdAndUpdate(
//     req.user.id,
//     filteredBody,
//     {
//       new: true,
//       runValidators: true,
//     }
//   )

//   res.json({ success: true, data: updatedUser });
// });

// // ✅ 3. إضافة عنوان جديد (مع معالجة الـ Default)
// exports.addAddress = catchAsync(async (req, res, next) => {
//   const session = await mongoose.startSession();
//   try {
//     await session.withTransaction(async () => {
//       // إذا كان العنوان الجديد هو الافتراضي، اجعل البقية false
//       if (req.body.isDefault) {
//         await AddressSchema.updateMany(
//           { user: req.user.id },
//           { isDefault: false },
//           { session }
//         );
//       }

//       const newAddress = await AddressSchema.create(
//         [{ ...req.body, user: req.user.id }],
//         { session }
//       );
//       res.status(201).json({ success: true, data: newAddress[0] });
//     });
//   } finally {
//     session.endSession();
//   }
// });

// // ✅ 4. حذف عنوان (Soft Delete)
// exports.deleteAddress = catchAsync(async (req, res, next) => {
//   const address = await AddressSchema.findOneAndUpdate(
//     { _id: req.params.id, user: req.user.id },
//     { isActive: false },
//     { new: true }
//   );

//   if (!address) return next(new AppError("العنوان غير موجود", 404));
//   res.json({ success: true, message: "تم حذف العنوان بنجاح" });
// });

// // ✅ 5. جعل عنوان معين هو الافتراضي
// exports.setDefaultAddress = catchAsync(async (req, res, next) => {
//   const session = await mongoose.startSession();
//   try {
//     await session.withTransaction(async () => {
//       await AddressSchema.updateMany(
//         { user: req.user.id },
//         { isDefault: false },
//         { session }
//       );

//       const address = await AddressSchema.findOneAndUpdate(
//         { _id: req.params.id, user: req.user.id },
//         { isDefault: true },
//         { new: true, session }
//       );

//       if (!address) throw new AppError("العنوان غير موجود", 404);
//       res.json({ success: true, data: address });
//     });
//   } finally {
//     session.endSession();
//   }
// });

// // دالة مساعدة لجلب العناوين فقط
// exports.getAddresses = catchAsync(async (req, res) => {
//   const addresses = await AddressSchema.find({
//     user: req.user.id,
//     isActive: true,
//   }).sort({ isDefault: -1 });
//   res.json({ success: true, data: addresses });
// });
// // const UserSchema = require("../schemas/User.schema");
// // const AddressSchema = require("../schemas/Address.schema");
// // const mongoose = require("mongoose");
// // const catchAsync = require("../utils/catch-async.utili");
// // const AppError = require("../utils/app-error.utili");

// // // ✅ 1. GET Profile كامل (User + Addresses)
// // exports.getProfile = catchAsync(async (req, res, next) => {
// //   const [user, addresses] = await Promise.all([
// //     UserSchema.findById(req.user.id).select("-password"),
// //     AddressSchema.find({ user: req.user.id, isActive: true }).sort({
// //       isDefault: -1,
// //       createdAt: -1,
// //     }),
// //   ]);

// //   res.json({
// //     success: true,
// //     data: {
// //       profile: {
// //         id: user._id,
// //         email: user.email,
// //         firstName: user.firstName,
// //         lastName: user.lastName,
// //         fullName: `${user.firstName} ${user.lastName}`,
// //         phone: user.phone,
// //         avatar: user.avatar,
// //         role: user.role,
// //         createdAt: user.createdAt,
// //       },
// //       addresses: addresses,
// //     },
// //   });
// // });

// // // ✅ 2. PATCH Profile - كل شيء في API واحدة!
// // exports.updateProfile = catchAsync(async (req, res, next) => {
// //   const session = await mongoose.startSession();
// //   const updates = req.body;

// //   try {
// //     await session.withTransaction(async () => {
// //       // 1️⃣ تحديث Profile الأساسي
// //       if (updates.profile) {
// //         await UserSchema.findByIdAndUpdate(req.user.id, updates.profile, {
// //           runValidators: true,
// //           session,
// //         });
// //       }

// //       // 2️⃣ إضافة Address جديد
// //       if (updates.action === "addAddress") {
// //         const addressData = { user: req.user.id, ...updates.address };

// //         if (addressData.isDefault) {
// //           await AddressSchema.updateMany(
// //             { user: req.user.id },
// //             { isDefault: false },
// //             { session }
// //           );
// //         }
// //         await AddressSchema.create([addressData], { session });
// //       }

// //       // 3️⃣ تحديث Address موجود
// //       if (updates.action === "updateAddress") {
// //         const address = await AddressSchema.findOneAndUpdate(
// //           { _id: updates.addressId, user: req.user.id },
// //           updates.address,
// //           { runValidators: true, session, new: true }
// //         );

// //         if (!address) {
// //           throw new AppError("العنوان غير موجود", 404);
// //         }
// //       }

// //       // 4️⃣ حذف Address (Soft Delete)
// //       if (updates.action === "deleteAddress") {
// //         const address = await AddressSchema.findOneAndUpdate(
// //           { _id: updates.addressId, user: req.user.id },
// //           { isActive: false },
// //           { session, new: true }
// //         );

// //         if (!address) {
// //           throw new AppError("العنوان غير موجود", 404);
// //         }
// //       }

// //       // 5️⃣ تحديث Default Address
// //       if (updates.defaultAddressId) {
// //         await AddressSchema.updateMany(
// //           { user: req.user.id },
// //           { isDefault: false },
// //           { session }
// //         );
// //         const defaultAddr = await AddressSchema.findByIdAndUpdate(
// //           updates.defaultAddressId,
// //           { isDefault: true },
// //           { session }
// //         );

// //         if (!defaultAddr) {
// //           throw new AppError("العنوان الافتراضي غير موجود", 404);
// //         }
// //       }

// //       // 🔄 إرجاع البيانات المُحدثة
// //       const [user, addresses] = await Promise.all([
// //         UserSchema.findById(req.user.id).select("-password"),
// //         AddressSchema.find({ user: req.user.id, isActive: true }).sort({
// //           isDefault: -1,
// //           createdAt: -1,
// //         }),
// //       ]);

// //       res.json({
// //         success: true,
// //         message: "تم التحديث بنجاح",
// //         data: {
// //           profile: {
// //             id: user._id,
// //             email: user.email,
// //             firstName: user.firstName,
// //             lastName: user.lastName,
// //             fullName: `${user.firstName} ${user.lastName}`,
// //             phone: user.phone,
// //             avatar: user.avatar,
// //           },
// //           addresses: addresses,
// //         },
// //       });
// //     });
// //   } catch (error) {
// //     throw new AppError(error.message || "خطأ في التحديث", 500);
// //   } finally {
// //     session.endSession();
// //   }
// // });

// // const UserSchema = require("../schemas/User.schema");
// // const AddressSchema = require("../schemas/Address.schema");
// // const mongoose = require("mongoose");
// // const catchAsync = require("../utils/catch-async.utili");
// // // const AppError = require("../utils/app-error.utili");

// // // ✅ 1. GET Profile كامل (User + Addresses)
// // exports.getProfile = catchAsync(async (req, res, next) => {
// //   const [user, addresses] = await Promise.all([
// //     UserSchema.findById(req.user.id).select("-password"),
// //     AddressSchema.find({ user: req.user.id, isActive: true }).sort({
// //       isDefault: -1,
// //       createdAt: -1,
// //     }),
// //   ]);

// //   res.json({
// //     success: true,
// //     data: {
// //       profile: {
// //         id: user._id,
// //         email: user.email,
// //         firstName: user.firstName,
// //         lastName: user.lastName,
// //         fullName: `${user.firstName} ${user.lastName}`,
// //         phone: user.phone,
// //         avatar: user.avatar,
// //         role: user.role,
// //         createdAt: user.createdAt,
// //       },
// //       addresses: addresses, // كاملة مع default flag
// //     },
// //   });
// // });

// // // ✅ 2. PATCH Profile - كل شيء في API واحدة!
// // exports.updateProfile = catchAsync(async (req, res, next) => {
// //   const session = await mongoose.startSession();
// //   const updates = req.body; // {action, data}

// //   try {
// //     await session.withTransaction(async () => {
// //       // 1️⃣ تحديث User Profile
// //       if (updates.profile) {
// //         await UserSchema.findByIdAndUpdate(
// //           req.user.id,
// //           updates.profile, // {firstName, lastName, phone}
// //           { runValidators: true, session }
// //         );
// //       }

// //       // 2️⃣ إضافة Address جديد
// //       if (updates.action === "addAddress") {
// //         const addressData = {
// //           user: req.user.id,
// //           ...updates.address, // {name, phones[], street, city...}
// //         };

// //         if (addressData.isDefault) {
// //           await AddressSchema.updateMany(
// //             { user: req.user.id },
// //             { isDefault: false },
// //             { session }
// //           );
// //         }

// //         await AddressSchema.create([addressData], { session });
// //       }

// //       // 3️⃣ تحديث Address موجود
// //       if (updates.action === "updateAddress") {
// //         await AddressSchema.findOneAndUpdate(
// //           { _id: updates.addressId, user: req.user.id },
// //           updates.address,
// //           { runValidators: true, session }
// //         );
// //       }

// //       // 4️⃣ حذف Address
// //       if (updates.action === "deleteAddress") {
// //         await AddressSchema.findOneAndUpdate(
// //           { _id: updates.addressId, user: req.user.id },
// //           { isActive: false },
// //           { session }
// //         );
// //       }

// //       // 5️⃣ تحديث Default Address
// //       if (updates.defaultAddressId) {
// //         await AddressSchema.updateMany(
// //           { user: req.user.id },
// //           { isDefault: false },
// //           { session }
// //         );
// //         await AddressSchema.findByIdAndUpdate(
// //           updates.defaultAddressId,
// //           { isDefault: true },
// //           { session }
// //         );
// //       }

// //       // إرجاع البيانات الجديدة
// //       const [user, addresses] = await Promise.all([
// //         UserSchema.findById(req.user.id).select("-password"),
// //         AddressSchema.find({ user: req.user.id, isActive: true }).sort({
// //           isDefault: -1,
// //           createdAt: -1,
// //         }),
// //       ]);

// //       res.json({
// //         success: true,
// //         message: "تم التحديث بنجاح",
// //         data: {
// //           profile: {
// //             id: user._id,
// //             email: user.email,
// //             firstName: user.firstName,
// //             lastName: user.lastName,
// //             fullName: `${user.firstName} ${user.lastName}`,
// //             phone: user.phone,
// //             avatar: user.avatar,
// //           },
// //           addresses: addresses,
// //         },
// //       });
// //     });
// //   } finally {
// //     session.endSession();
// //   }
// // });

// // const UserSchema = require("../schemas/User.schema");
// // const AddressSchema = require("../schemas/Address.schema");
// // const mongoose = require("mongoose");
// // const catchAsync = require("../utils/catch-async.utili");
// // const AppError = require("../utils/app-error.utili");

// // // ✅ 1. GET Profile كامل (موجود)
// // exports.getProfile = catchAsync(async (req, res, next) => {
// //   const [user, addresses, defaultAddress] = await Promise.all([
// //     UserSchema.findById(req.user.id).select("-password"),
// //     AddressSchema.find({ user: req.user.id, isActive: true }).sort({
// //       isDefault: -1,
// //       createdAt: -1,
// //     }),
// //     AddressSchema.findOne({
// //       user: req.user.id,
// //       isActive: true,
// //       isDefault: true,
// //     }),
// //   ]);

// //   res.json({
// //     success: true,
// //     data: {
// //       profile: {
// //         id: user._id,
// //         email: user.email,
// //         fullName: `${user.firstName} ${user.lastName}`,
// //         firstName: user.firstName,
// //         lastName: user.lastName,
// //         phone: user.phone,
// //         avatar: user.avatar,
// //         role: user.role,
// //         createdAt: user.createdAt,
// //       },
// //       addresses: {
// //         list: addresses,
// //         count: addresses.length,
// //         default: defaultAddress || null,
// //       },
// //     },
// //   });
// // });

// // // ✅ 2. UPDATE Profile (موجود ومحسن)
// // exports.updateProfile = catchAsync(async (req, res, next) => {
// //   const { firstName, lastName, phone, defaultAddressId } = req.body;
// //   const session = await mongoose.startSession();

// //   try {
// //     await session.withTransaction(async () => {
// //       const user = await UserSchema.findByIdAndUpdate(
// //         req.user.id,
// //         { firstName, lastName, phone },
// //         { new: true, runValidators: true, session }
// //       ).select("-password");

// //       if (defaultAddressId) {
// //         await AddressSchema.updateMany(
// //           { user: req.user.id },
// //           { isDefault: false },
// //           { session }
// //         );
// //         await AddressSchema.findByIdAndUpdate(
// //           defaultAddressId,
// //           { isDefault: true },
// //           { session }
// //         );
// //       }

// //       res.json({
// //         success: true,
// //         message: "تم تحديث الملف الشخصي بنجاح",
// //         data: {
// //           profile: user,
// //           defaultAddressId: defaultAddressId || null,
// //         },
// //       });
// //     });
// //   } finally {
// //     session.endSession();
// //   }
// // });

// // // ✅ 3. إضافة Address جديد
// // exports.addAddress = catchAsync(async (req, res, next) => {
// //   const addressData = {
// //     user: req.user.id,
// //     name: req.body.name,
// //     phones: req.body.phones, // array of {number, type}
// //     street: req.body.street,
// //     city: req.body.city,
// //     area: req.body.area,
// //     postalCode: req.body.postalCode,
// //     country: req.body.country || "مصر",
// //     type: req.body.type || "home",
// //     isDefault: req.body.isDefault || false,
// //   };

// //   // إذا isDefault = true، اجعل الباقي false
// //   if (addressData.isDefault) {
// //     await AddressSchema.updateMany({ user: req.user.id }, { isDefault: false });
// //   }

// //   const address = await AddressSchema.create(addressData);

// //   res.status(201).json({
// //     success: true,
// //     message: "تم إضافة العنوان بنجاح",
// //     data: address,
// //   });
// // });

// // // ✅ 4. إضافة رقم هاتف لعنوان موجود
// // exports.addPhoneToAddress = catchAsync(async (req, res, next) => {
// //   const { addressId, number, type = "mobile", isPrimary = false } = req.body;

// //   // التحقق من العنوان
// //   const address = await AddressSchema.findOne({
// //     _id: addressId,
// //     user: req.user.id,
// //   });

// //   if (!address) {
// //     return next(new AppError("العنوان غير موجود", 404));
// //   }

// //   // إذا isPrimary، اجعل الباقي false
// //   if (isPrimary) {
// //     address.phones = address.phones.map((phone) => ({
// //       ...phone,
// //       isPrimary: false,
// //     }));
// //   }

// //   // إضافة الرقم الجديد
// //   address.phones.push({ number, type, isPrimary });
// //   await address.save();

// //   res.json({
// //     success: true,
// //     message: "تم إضافة الرقم بنجاح",
// //     data: {
// //       addressId: address._id,
// //       phones: address.phones,
// //     },
// //   });
// // });

// // // ✅ 5. حذف رقم هاتف من عنوان
// // exports.removePhoneFromAddress = catchAsync(async (req, res, next) => {
// //   const { addressId, phoneIndex } = req.body;

// //   const address = await AddressSchema.findOne({
// //     _id: addressId,
// //     user: req.user.id,
// //   });

// //   if (!address || !address.phones[phoneIndex]) {
// //     return next(new AppError("الرقم أو العنوان غير موجود", 404));
// //   }

// //   address.phones.splice(phoneIndex, 1);
// //   await address.save();

// //   res.json({
// //     success: true,
// //     message: "تم حذف الرقم بنجاح",
// //     data: {
// //       addressId: address._id,
// //       phones: address.phones,
// //     },
// //   });
// // });
