const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: { type: Boolean, default: true },
    avatar: { type: String, default: null },

    // ✅ OTP fields
    otpCode: { type: String, select: false },
    otpExpire: { type: Date, select: false },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash كلمة المرور قبل الحفظ
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next;
});
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password; // حذف كلمة المرور
    delete ret.__v;
    delete ret.isActive;
    delete ret.updatedAt;
    delete ret.createdAt;
    return ret;
  },
});

// مقارنة كلمة المرور
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ Generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits

  this.otpCode = crypto.createHash("sha256").update(otp).digest("hex");
  this.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp; // Return plain OTP to send to user
};

// ✅ Verify OTP
userSchema.methods.verifyOTP = function (enteredOTP) {
  const hashedOTP = crypto
    .createHash("sha256")
    .update(enteredOTP)
    .digest("hex");
  return this.otpCode === hashedOTP && this.otpExpire > Date.now();
};

module.exports = model("User", userSchema);
