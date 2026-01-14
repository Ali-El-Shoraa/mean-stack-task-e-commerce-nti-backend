const dotenv = require("dotenv");
// 1. تحميل إعدادات dotenv
dotenv.config();

const express = require("express");
// const mongoose = require("mongoose");
// const morgan = require("morgan"); // اختياري: لمراقبة الطلبات (Logs)

const app = express();

const corsMiddleware = require("./src/middlewares/cors.middleware");
app.use(corsMiddleware);
app.use(express.json());
app.use("/api/v1/auth", require("./src/routes/auth.routes"));
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev")); // سيطبع لك في الكونسول نوع الـ Request والوقت
// }

const connectDB = require("./src/config/db.config");
connectDB();

const AppError = require("./src/utils/app-error.utili");
const globalErrorHandler = require("./src/middlewares/error-handeler.middleware");

app.use((req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

// 5. تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, (error) => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});
