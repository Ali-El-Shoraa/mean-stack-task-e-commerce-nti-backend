const logger = require("../config/logger.config");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  logger.error(
    `Error found | ${req.method} | ${req.originalUrl} | ${err.message}`,
    {
      stack: err.stack,
      user: req.user?.id,
      statusCode: err.statusCode,
    }
  );

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      return res.status(err.statusCode).json({
        status: "error",
        message: "Somthing went wrong",
      });
    }
  }
};
