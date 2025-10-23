const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");

const ORDER_NUMBER_REGEX = /^[A-Z]{3,5}-\d{4}-\d{4,}$/;
const RETURN_STATUS_OPTIONS = [
  "requested",
  "approved",
  "rejected",
  "in-transit",
  "received",
  "completed",
  "cancelled",
];
const RETURN_RESOLUTION_OPTIONS = [
  "refund",
  "replacement",
  "store-credit",
  "exchange",
];

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
    .custom((value, { req }) => {
      if (mongoose.Types.ObjectId.isValid(value)) {
        return true;
      }

      const normalizedIdentifier = value.toUpperCase();
      if (ORDER_NUMBER_REGEX.test(normalizedIdentifier)) {
        req.params.id = normalizedIdentifier;
        return true;
      }

      throw new Error("Invalid order identifier format");
    }),

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

exports.validateReturnRequest = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item must be selected for return"),

  body("items.*.itemId")
    .notEmpty()
    .withMessage("Return item identifier is required")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid return item identifier"),

  body("items.*.quantity")
    .optional()
    .toInt()
    .isInt({ min: 1 })
    .withMessage("Return quantity must be at least 1"),

  body("reason")
    .notEmpty()
    .withMessage("Return reason is required")
    .isString()
    .withMessage("Return reason must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Return reason cannot exceed 500 characters"),

  body("customerNotes")
    .optional()
    .isString()
    .withMessage("Customer notes must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Customer notes cannot exceed 1000 characters"),

  body("evidence")
    .optional()
    .isArray()
    .withMessage("Evidence must be an array of URLs or identifiers"),

  body("evidence.*")
    .optional()
    .isString()
    .withMessage("Each evidence entry must be a string"),

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

exports.validateUpdateReturnStatus = [
  body("status")
    .notEmpty()
    .withMessage("Return status is required")
    .isString()
    .withMessage("Return status must be a string")
    .trim()
    .isIn(RETURN_STATUS_OPTIONS.filter((status) => status !== "requested"))
    .withMessage("Invalid return status"),

  body("adminNotes")
    .optional()
    .isString()
    .withMessage("Admin notes must be a string")
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Admin notes cannot exceed 1000 characters"),

  body("resolution")
    .optional()
    .isString()
    .withMessage("Resolution must be a string")
    .trim()
    .isIn(RETURN_RESOLUTION_OPTIONS)
    .withMessage("Invalid resolution option"),

  body("refundAmount")
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage("Refund amount must be a positive number"),

  body("evidence")
    .optional()
    .isArray()
    .withMessage("Evidence must be an array"),

  body("evidence.*")
    .optional()
    .isString()
    .withMessage("Each evidence entry must be a string"),

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
