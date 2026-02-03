const { createLogger, format, transports } = require("winston");
const { keys } = require("../../keys");
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} | ${level} | ${message} ${
        stack ? `\n${stack}` : ""
      }`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: `${keys.logs}/error.log`,
      level: "error",
    }),
    new transports.File({ filename: `${keys.logs}/combind.log` }),
  ],
});
module.exports = logger;
