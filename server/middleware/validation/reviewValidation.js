const { body, param, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Product = require("../../models/Product");

const resolveProductId = async (identifier) => {
  if (!identifier) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return identifier;
  }

  if (typeof identifier !== "string") {
    return null;
  }

  const normalized = identifier.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  const product = await Product.findOne({ slug: normalized }).select("_id");
  return product ? product._id.toString() : null;
};

/**
 * Validation middleware for creating a review
 */
exports.validateCreateReview = [
  body("productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .bail()
    .custom(async (value, { req }) => {
      const resolved = await resolveProductId(value);
      if (!resolved) {
        throw new Error("Product not found");
      }
      req.body.productId = resolved;
      return true;
    }),

  body("orderId")
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid order ID format");
      }
      return true;
    }),

  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters")
    .trim(),

  body("comment")
    .notEmpty()
    .withMessage("Comment is required")
    .isString()
    .withMessage("Comment must be a string")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Comment must be between 10 and 2000 characters")
    .trim(),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),

  body("images.*.url")
    .optional()
    .isString()
    .withMessage("Image URL must be a string")
    .isURL()
    .withMessage("Invalid image URL"),

  body("images.*.alt")
    .optional()
    .isString()
    .withMessage("Image alt text must be a string")
    .isLength({ max: 200 })
    .withMessage("Image alt text cannot exceed 200 characters"),

  body("variant")
    .optional()
    .isObject()
    .withMessage("Variant must be an object"),

  body("variant.size")
    .optional()
    .isString()
    .withMessage("Variant size must be a string")
    .isLength({ max: 50 })
    .withMessage("Variant size cannot exceed 50 characters"),

  body("variant.color")
    .optional()
    .isString()
    .withMessage("Variant color must be a string")
    .isLength({ max: 50 })
    .withMessage("Variant color cannot exceed 50 characters"),

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
 * Validation middleware for updating a review
 */
exports.validateUpdateReview = [
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("title")
    .optional()
    .isString()
    .withMessage("Title must be a string")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters")
    .trim(),

  body("comment")
    .optional()
    .isString()
    .withMessage("Comment must be a string")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Comment must be between 10 and 2000 characters")
    .trim(),

  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array"),

  body("images.*.url")
    .optional()
    .isString()
    .withMessage("Image URL must be a string")
    .isURL()
    .withMessage("Invalid image URL"),

  body("variant")
    .optional()
    .isObject()
    .withMessage("Variant must be an object"),

  body("variant.size")
    .optional()
    .isString()
    .withMessage("Variant size must be a string")
    .isLength({ max: 50 })
    .withMessage("Variant size cannot exceed 50 characters"),

  body("variant.color")
    .optional()
    .isString()
    .withMessage("Variant color must be a string")
    .isLength({ max: 50 })
    .withMessage("Variant color cannot exceed 50 characters"),

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
 * Validation middleware for review ID parameter
 */
exports.validateReviewId = [
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid review ID format"),

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
 * Validation middleware for rejecting a review
 */
exports.validateRejectReview = [
  body("reason")
    .optional()
    .isString()
    .withMessage("Rejection reason must be a string")
    .isLength({ min: 10, max: 500 })
    .withMessage("Rejection reason must be between 10 and 500 characters")
    .trim(),

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
 * Validation middleware for admin response
 */
exports.validateAdminResponse = [
  body("message")
    .notEmpty()
    .withMessage("Response message is required")
    .isString()
    .withMessage("Response message must be a string")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Response message must be between 10 and 1000 characters")
    .trim(),

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
