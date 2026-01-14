const jwt = require("jsonwebtoken");
const AppError = require("../utils/app-error.utili");
const catchAsync = require("../utils/catch-async.utili");
const cache = require("../config/cache.config");
const logger = require("../config/logger.config");
const UserSchema = require("../schemas/User.schema");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

// ✅ محاكاة إرسال OTP (في الحقيقة سيكون عبر SMS أو Email)
const sendOTP = (email, otp) => {
  console.log(`
    ========================================
    📧 OTP Simulation
    ========================================
    Email: ${email}
    OTP Code: ${otp}
    Valid for: 10 minutes
    ========================================
  `);
  logger.info(`OTP sent to ${email}: ${otp}`);
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, phone } = req.body;

  // ✅ Aggregation Pipeline - أسرع وأقوى من findOne
  const userExists = await UserSchema.aggregate([
    {
      $match: {
        email: email,
        isActive: true,
      },
    },
    {
      $limit: 1,
    },
    {
      $project: {
        _id: 1,
        email: 1,
      },
    },
  ]);

  if (userExists.length > 0) {
    return next(new AppError("البريد الإلكتروني مستخدم بالفعل", 400));
  }

  const user = await UserSchema.create({
    email,
    password,
    firstName,
    lastName,
    phone,
  });

  const token = generateToken(user._id);

  logger.info(`New user registered: ${email}`);

  // const userData = {
  //   id: user._id,
  //   email: user.email,
  //   firstName: user.firstName,
  //   lastName: user.lastName,
  //   phone: user.phone,
  //   role: user.role,
  //   avatar: user.avatar,
  //   isActive: user.isActive,
  // };

  // Cache
  // cache.set(`user:${user._id}`, userData, 3600);

  res.status(201).json({
    success: true,
    message: "تم التسجيل بنجاح",
    token,
    // user: userData,
    user,
    // clg: userExists,
  });
});

// exports.register = catchAsync(async (req, res, next) => {
//   const { email, password, firstName, lastName, phone } = req.body;

//   const userExists = await UserSchema.findOne({ isActive: true, email });
//   if (userExists) {
//     return next(
//       new AppError(
//         "حدث خطأ ما - البريد الالكتروني او كلمه المرور غير صحيحه",
//         400
//       )
//     );
//   }

//   const user = await UserSchema.create({
//     email,
//     password,
//     firstName,
//     lastName,
//     phone,
//   });

//   //   const token = generateToken(user._id);
//   logger.info(`New user registered: ${email}`);

//   const userData = {
//     id: user._id,
//     email: user.email,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     phone: user.phone,
//     role: user.role,
//     avatar: user.avatar,
//     isActive: user.isActive,
//   };

//   res.status(201).json({
//     success: true,
//     message: "تم التسجيل بنجاح",
//     user: userData, // ✅ كامل البيانات هنا
//   });
// });

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("يرجى إدخال البريد الإلكتروني وكلمة المرور", 400));
  }

  const user = await UserSchema.findOne({ email, isActive: true });
  // .select(
  //   "+password"
  // );

  if (!user || !(await user.matchPassword(password))) {
    logger.warn(`Failed login attempt: ${email}`);
    return next(new AppError("بيانات تسجيل الدخول غير صحيحة", 401));
  }

  const token = generateToken(user._id);

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: "تم تسجيل الدخول بنجاح",
    token,
    user,
  });
});

// @desc    Update user profile (firstName, lastName, phone, avatar)
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = catchAsync(async (req, res, next) => {
  const { firstName, lastName, phone, avatar } = req.body;

  // ✅ منع تعديل البريد وكلمة المرور من هنا
  const allowedFields = { firstName, lastName, phone, avatar };
  Object.keys(allowedFields).forEach(
    (key) => allowedFields[key] === undefined && delete allowedFields[key]
  );

  const user = await UserSchema.findByIdAndUpdate(req.user.id, allowedFields, {
    new: true,
    runValidators: true,
  }).select("-password");

  //   cache.del(`user:${req.user.id}`);
  logger.info(`User profile updated: ${user.email}`);

  res.json({
    success: true,
    message: "تم تحديث الملف الشخصي بنجاح",
    user,
  });
});

// ✅ @desc    Request OTP to change password
// @route   POST /api/auth/request-password-otp
// @access  Private
exports.requestPasswordOTP = catchAsync(async (req, res, next) => {
  const user = await UserSchema.findById(req.user.id).select(
    "+otpCode +otpExpire"
  );

  if (!user) {
    return next(new AppError("المستخدم غير موجود", 404));
  }

  // Generate OTP
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  // محاكاة إرسال OTP
  sendOTP(user.email, otp);

  res.json({
    success: true,
    message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
  });
});

// ✅ @desc    Change password with OTP
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = catchAsync(async (req, res, next) => {
  const { otp, newPassword } = req.body;

  if (!otp || !newPassword) {
    return next(
      new AppError("يرجى إدخال رمز التحقق وكلمة المرور الجديدة", 400)
    );
  }

  const user = await UserSchema.findById(req.user.id).select(
    "+otpCode +otpExpire +password"
  );

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    return next(new AppError("رمز التحقق غير صحيح أو منتهي الصلاحية", 400));
  }

  // Update password
  user.password = newPassword;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save();

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: "تم تغيير كلمة المرور بنجاح",
  });
});

// ✅ @desc    Forgot password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("يرجى إدخال البريد الإلكتروني", 400));
  }

  const user = await UserSchema.findOne({ email }).select(
    "+otpCode +otpExpire"
  );

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا البريد الإلكتروني", 404));
  }

  // Generate OTP
  const otp = user.generateOTP();
  await user.save({ validateBeforeSave: false });

  // محاكاة إرسال OTP
  sendOTP(user.email, otp);

  res.json({
    success: true,
    message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني",
  });
});

// ✅ @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError("يرجى إدخال جميع الحقول المطلوبة", 400));
  }

  const user = await UserSchema.findOne({ email }).select(
    "+otpCode +otpExpire +password"
  );

  if (!user) {
    return next(new AppError("المستخدم غير موجود", 404));
  }

  // Verify OTP
  if (!user.verifyOTP(otp)) {
    return next(new AppError("رمز التحقق غير صحيح أو منتهي الصلاحية", 400));
  }

  // Update password
  user.password = newPassword;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save();

  logger.info(`Password reset for user: ${user.email}`);

  const token = generateToken(user._id);

  res.json({
    success: true,
    message: "تم إعادة تعيين كلمة المرور بنجاح",
    token,
  });
});
