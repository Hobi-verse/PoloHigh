const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  getProductVariants,
  checkAvailability,
} = require("../Controllers/productController");

// Import middleware (will create these next)
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { validateProduct, validateProductUpdate } = require("../middleware/validation/productValidation");

// Public routes
router.get("/", getAllProducts); // GET /api/products
router.get("/:id", getProductById); // GET /api/products/:id
router.get("/:id/variants", getProductVariants); // GET /api/products/:id/variants
router.get("/:id/availability", checkAvailability); // GET /api/products/:id/availability

// Protected admin routes
router.post("/", protect, adminOnly, validateProduct, createProduct); // POST /api/products
router.put("/:id", protect, adminOnly, validateProductUpdate, updateProduct); // PUT /api/products/:id
router.delete("/:id", protect, adminOnly, deleteProduct); // DELETE /api/products/:id
router.patch("/:id/stock", protect, adminOnly, updateProductStock); // PATCH /api/products/:id/stock

module.exports = router;
