const { Router } = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { addToCart } = require("../controllers/cart.controller");

const router = Router();

router.post("/", protect, addToCart);

module.exports = router;
