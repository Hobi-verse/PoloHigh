const express = require("express");
const router = express.Router();

const {
  searchProducts,
  getSearchSuggestions,
  searchOrders,
  searchCustomers,
} = require("../Controllers/searchController");

const { protect, restrictTo } = require("../middleware/authMiddleware");

const {
  validateProductSearch,
  validateSearchSuggestions,
  validateOrderSearch,
  validateCustomerSearch,
} = require("../middleware/validation/searchValidation");

// =========================================================
// Public search routes
// =========================================================

router.get("/products", validateProductSearch, searchProducts);

router.get("/suggestions", validateSearchSuggestions, getSearchSuggestions);

// =========================================================
// Admin search routes
// =========================================================

router.get(
  "/admin/orders",
  protect,
  restrictTo("admin"),
  validateOrderSearch,
  searchOrders
);

router.get(
  "/admin/customers",
  protect,
  restrictTo("admin"),
  validateCustomerSearch,
  searchCustomers
);

module.exports = router;
