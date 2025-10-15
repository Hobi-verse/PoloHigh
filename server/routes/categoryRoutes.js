const express = require("express");
const router = express.Router();
const {
  getAllCategories,
  getCategoryBySlug,
  getCategoryFilters,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
  updateProductCount,
  getCategoryTree,
} = require("../Controllers/categoryController");

// Import middleware
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { validateCategory, validateCategoryUpdate } = require("../middleware/validation/categoryValidation");

// Public routes
router.get("/", getAllCategories); // GET /api/categories
router.get("/tree", getCategoryTree); // GET /api/categories/tree (must be before /:slug)
router.get("/:slug", getCategoryBySlug); // GET /api/categories/:slug
router.get("/:slug/filters", getCategoryFilters); // GET /api/categories/:slug/filters
router.get("/:slug/products", getCategoryProducts); // GET /api/categories/:slug/products

// Protected admin routes
router.post("/", protect, adminOnly, validateCategory, createCategory); // POST /api/categories
router.put("/:slug", protect, adminOnly, validateCategoryUpdate, updateCategory); // PUT /api/categories/:slug
router.delete("/:slug", protect, adminOnly, deleteCategory); // DELETE /api/categories/:slug
router.patch("/:slug/product-count", protect, adminOnly, updateProductCount); // PATCH /api/categories/:slug/product-count

module.exports = router;
