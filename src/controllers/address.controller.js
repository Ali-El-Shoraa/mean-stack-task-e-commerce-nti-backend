const AddressSchema = require("../schemas/Address.schema");

// ✅ إضافة عنوان
exports.addAddress = catchAsync(async (req, res) => {
  const address = await AddressSchema.create({
    user: req.user.id,
    ...req.body,
  });

  // جعل الأول عنوان افتراضي
  if (address.isDefault) {
    await AddressSchema.updateMany(
      { user: req.user.id, _id: { $ne: address._id } },
      { isDefault: false },
    );
  }

  res.status(201).json({
    success: true,
    data: address,
  });
});

// ✅ جلب عناويني
exports.getMyAddresses = catchAsync(async (req, res) => {
  const addresses = await AddressSchema.find({
    user: req.user.id,
    isActive: true,
  }).sort({ isDefault: -1, createdAt: -1 });

  res.json({
    success: true,
    count: addresses.length,
    data: addresses,
  });
});

// ✅ تحديث عنوان
exports.updateAddress = catchAsync(async (req, res) => {
  const address = await AddressSchema.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!address) {
    return next(new AppError("العنوان غير موجود", 404));
  }

  res.json({ success: true, data: address });
});

// ✅ حذف عنوان
exports.deleteAddress = catchAsync(async (req, res) => {
  const address = await AddressSchema.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isActive: false },
    { new: true },
  );

  if (!address) {
    return next(new AppError("العنوان غير موجود", 404));
  }

  res.json({ success: true, message: "تم حذف العنوان" });
});
