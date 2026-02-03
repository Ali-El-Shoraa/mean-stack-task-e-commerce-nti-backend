const jwt = require("jsonwebtoken");
const AppError = require("../utils/app-error.utili");
const catchAsync = require("../utils/catch-async.utili");
const UserSchema = require("../schemas/User.schema");

const protect = catchAsync(async (req, res, next) => {
  let token;

  // Get token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("غير مصرح لك بالوصول لهذا المسار. يرجى تسجيل الدخول", 401)
    );
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check if user still exists
  const user = await UserSchema.findById(decoded.id).select("-password");

  if (!user) {
    return next(new AppError("المستخدم لم يعد موجوداً", 401));
  }

  if (!user.isActive) {
    return next(new AppError("تم تعطيل حسابك", 403));
  }

  // Grant access
  req.user = user;
  next();
});

// Restrict to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("ليس لديك صلاحية للقيام بهذا الإجراء", 403));
    }
    next();
  };
};

// *************************************

// middlewares/auth.middleware.js

// const authenticate = async (req, res, next) => {
//   try {
//     // 1. استخراج Token من Header
//     let token;
//     if (req.headers.authorization &&
//         req.headers.authorization.startsWith('Bearer')) {
//       token = req.headers.authorization.split(' ')[1]; // Bearer <token>
//     }

//     if (!token) {
//       return next(new AppError('الرجاء تسجيل الدخول أولاً', 401));
//     }

//     // 2. التحقق من صحة Token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // 3. جلب بيانات المستخدم + إضافة لـ Request
//     const user = await UserSchema.findById(decoded.id).select('-password');
//     if (!user) {
//       return next(new AppError('المستخدم غير موجود', 401));
//     }

//     req.user = user; // ✅ إضافة المستخدم للـ Request
//     next();
//   } catch (error) {
//     next(new AppError('Token غير صالح', 401));
//   }
// };

module.exports = { protect, restrictTo };
