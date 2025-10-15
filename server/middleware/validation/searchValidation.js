const { query } = require("express-validator");

const commonPaginationValidators = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

exports.validateProductSearch = [
  query("q")
    .optional()
    .isString()
    .withMessage("query must be a string")
    .trim()
    .isLength({ max: 120 })
    .withMessage("query cannot exceed 120 characters"),
  query("category")
    .optional()
    .isString()
    .withMessage("category must be a string")
    .trim()
    .isLength({ max: 60 })
    .withMessage("category cannot exceed 60 characters"),
  query("minPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("minPrice must be a positive number"),
  query("maxPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("maxPrice must be a positive number"),
  query("minRating")
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage("minRating must be between 0 and 5"),
  query("tags")
    .optional()
    .isString()
    .withMessage("tags must be a comma separated string"),
  query("inStock")
    .optional()
    .isIn(["true", "false"])
    .withMessage("inStock must be true or false"),
  query("sortBy")
    .optional()
    .isIn(["relevance", "price", "newest", "rating"])
    .withMessage("Invalid sortBy value"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
  ...commonPaginationValidators,
];

exports.validateSearchSuggestions = [
  query("q")
    .optional()
    .isString()
    .withMessage("query must be a string")
    .trim()
    .isLength({ max: 120 })
    .withMessage("query cannot exceed 120 characters"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("limit must be between 1 and 20"),
];

exports.validateOrderSearch = [
  query("q")
    .optional()
    .isString()
    .withMessage("query must be a string")
    .trim()
    .isLength({ max: 120 })
    .withMessage("query cannot exceed 120 characters"),
  query("status")
    .optional()
    .isIn([
      "pending",
      "confirmed",
      "processing",
      "packed",
      "shipped",
      "out-for-delivery",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .withMessage("Invalid order status"),
  query("fromDate")
    .optional()
    .isISO8601()
    .withMessage("fromDate must be a valid date"),
  query("toDate")
    .optional()
    .isISO8601()
    .withMessage("toDate must be a valid date"),
  query("sortBy")
    .optional()
    .isIn(["placedAt", "grandTotal", "status"])
    .withMessage("Invalid sortBy value"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
  ...commonPaginationValidators,
];

exports.validateCustomerSearch = [
  query("q")
    .optional()
    .isString()
    .withMessage("query must be a string")
    .trim()
    .isLength({ max: 120 })
    .withMessage("query cannot exceed 120 characters"),
  query("membershipTier")
    .optional()
    .isIn(["Bronze", "Silver", "Gold", "Emerald", "Sapphire Elite"])
    .withMessage("Invalid membership tier"),
  query("minOrders")
    .optional()
    .isInt({ min: 0 })
    .withMessage("minOrders must be a positive integer"),
  query("maxOrders")
    .optional()
    .isInt({ min: 0 })
    .withMessage("maxOrders must be a positive integer"),
  query("sortBy")
    .optional()
    .isIn(["recentActivity", "totalSpent", "orders"])
    .withMessage("Invalid sortBy value"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("sortOrder must be asc or desc"),
  ...commonPaginationValidators,
];
