const express = require("express");
const {
  createProduct,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  updateStock,
} = require("../controllers/product.controller");
const { authorize } = require("../middlewares/role.middleware");
const { protect } = require("../middlewares/auth.middleware");
// const { authenticate, authorize } = require("../middlewares/auth.middleware");

const router = express.Router();

// ✅ Public Routes
router.get("/", getAllProducts);
router.get("/:id", getProduct);
router.get("/:slug", getProduct);

// ✅ Admin Routes
router.use(protect, authorize("admin"));
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.patch("/stock", updateStock);

module.exports = router;
