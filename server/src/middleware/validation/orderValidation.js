const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

/**
 * Validation middleware for creating an order
 */
exports.validateCreateOrder = [
  body("addressId")
    .notEmpty()
    .withMessage("Shipping address is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid address ID format"),

  body("paymentMethod")
    .notEmpty()
    .withMessage("Payment method is required")
    .isString()
    .withMessage("Payment method must be a string")
    .isIn([
      "COD",
      "UPI",
      "Credit Card",
      "Debit Card",
      "Net Banking",
      "Wallet",
    ])
    .withMessage("Invalid payment method"),

  body("paymentMethodId")
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid payment method ID format");
      }
      return true;
    }),

  body("customerNotes")
    .optional()
    .isString()
    .withMessage("Customer notes must be a string")
    .isLength({ max: 500 })
    .withMessage("Customer notes cannot exceed 500 characters"),

  body("useCartItems")
    .optional()
    .isBoolean()
    .withMessage("useCartItems must be a boolean"),

  body("items")
    .optional()
    .isArray()
    .withMessage("Items must be an array"),

  body("items.*.productId")
    .optional()
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid product ID format"),

  body("items.*.variantSku")
    .optional()
    .isString()
    .withMessage("Variant SKU must be a string"),

  body("items.*.quantity")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Quantity must be between 1 and 10"),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];

/**
 * Validation middleware for updating order status
 */
exports.validateUpdateOrderStatus = [
  body("status")
    .notEmpty()
    .withMessage("Status is required")
    .isString()
    .withMessage("Status must be a string")
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

  body("trackingNumber")
    .optional()
    .isString()
    .withMessage("Tracking number must be a string")
    .isLength({ min: 5, max: 50 })
    .withMessage("Tracking number must be between 5 and 50 characters"),

  body("courierService")
    .optional()
    .isString()
    .withMessage("Courier service must be a string")
    .isLength({ max: 100 })
    .withMessage("Courier service cannot exceed 100 characters"),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];

/**
 * Validation middleware for cancelling an order
 */
exports.validateCancelOrder = [
  body("reason")
    .optional()
    .isString()
    .withMessage("Cancellation reason must be a string")
    .isLength({ min: 10, max: 500 })
    .withMessage("Cancellation reason must be between 10 and 500 characters"),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];

/**
 * Validation middleware for order ID parameter
 */
exports.validateOrderId = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid order ID format"),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];

/**
 * Validation middleware for confirming payment
 */
exports.validateConfirmPayment = [
  body("transactionId")
    .optional()
    .isString()
    .withMessage("Transaction ID must be a string")
    .isLength({ min: 5, max: 100 })
    .withMessage("Transaction ID must be between 5 and 100 characters"),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }
    next();
  },
];
