const dotenv = require("dotenv");
dotenv.config();

const path = require("path");
const express = require("express");
// const mongoose = require("mongoose");
// const morgan = require("morgan"); // اختياري: لمراقبة الطلبات (Logs)

const app = express();
const { keys } = require("./keys");

const corsMiddleware = require("./src/middlewares/cors.middleware");
app.use(corsMiddleware);
app.use(express.json());
app.use("/images", express.static(path.join(__dirname, keys.upload_path)));

app.use("/api/v1/auth", require("./src/routes/auth.routes"));
app.use("/api/v1/settings", require("./src/routes/settings.routes"));
app.use("/api/v1/top-sellers", require("./src/routes/topSellers.routes"));
app.use("/api/v1/orders/checkout", require("./src/routes/order.routes"));
app.use("/api/v1/cart/add", require("./src/routes/cart.routes"));
app.use("/api/v1/products", require("./src/routes/product.routes"));
app.use("/api/v1/profile", require("./src/routes/profile.routes"));
app.use("/api/v1/payment", require("./src/routes/payment.routes"));
app.use("/api/v1/dashboard", require("./src/routes/dashboard.routes"));

// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev")); // سيطبع لك في الكونسول نوع الـ Request والوقت
// }

const connectDB = require("./src/config/db.config");
connectDB();

const AppError = require("./src/utils/app-error.utili");
const globalErrorHandler = require("./src/middlewares/error-handeler.middleware");
// const { keys } = require("./keys");

app.use((req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, (error) => {
  console.log(
    `🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
});
