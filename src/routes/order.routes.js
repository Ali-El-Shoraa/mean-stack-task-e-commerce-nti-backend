const { Router } = require("express");
// const { checkout } = require("../controllers/order.controller");
const { protect } = require("../middlewares/auth.middleware");
const { checkout } = require("../controllers/order.controller");

const router = Router();

router.post("/", protect, checkout);

module.exports = router;
