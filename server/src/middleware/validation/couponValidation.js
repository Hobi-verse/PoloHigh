const { body, param } = require("express-validator");
const mongoose = require("mongoose");

/**
 * Validation for coupon code check
 */
exports.validateCouponCode = [
  body("code")
    .notEmpty()
    .withMessage("Coupon code is required")
    .isString()
    .withMessage("Coupon code must be a string")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Coupon code must be between 3 and 50 characters")
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage("Coupon code can only contain letters, numbers, hyphens, and underscores"),
];

/**
 * Validation for coupon application
 */
exports.validateCouponApplication = [
  body("code")
    .optional()
    .isString()
    .withMessage("Coupon code must be a string")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Coupon code must be between 3 and 50 characters"),

  body("orderAmount")
    .notEmpty()
    .withMessage("Order amount is required")
    .isFloat({ min: 0 })
    .withMessage("Order amount must be a positive number"),

  body("items")
    .notEmpty()
    .withMessage("Cart items are required")
    .isArray({ min: 1 })
    .withMessage("Cart must contain at least one item"),

  body("items.*.productId")
    .notEmpty()
    .withMessage("Product identifier is required for each item")
    .custom((value) => {
      if (typeof value !== "string") {
        throw new Error("Product identifier must be a string");
      }

      if (mongoose.Types.ObjectId.isValid(value)) {
        return true;
      }

      if (value.trim().length >= 1) {
        return true;
      }

      throw new Error("Invalid product identifier format");
    }),

  body("items.*.quantity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("items.*.price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
];

/**
 * Validation for creating a coupon
 */
exports.validateCreateCoupon = [
  body("code")
    .notEmpty()
    .withMessage("Coupon code is required")
    .isString()
    .withMessage("Coupon code must be a string")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Coupon code must be between 3 and 50 characters")
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage("Coupon code can only contain letters, numbers, hyphens, and underscores")
    .toUpperCase(),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("discountType")
    .notEmpty()
    .withMessage("Discount type is required")
    .isIn(["percentage", "fixed", "freeShipping"])
    .withMessage("Discount type must be percentage, fixed, or freeShipping"),

  body("discountValue")
    .notEmpty()
    .withMessage("Discount value is required")
    .isFloat({ min: 0 })
    .withMessage("Discount value must be a positive number")
    .custom((value, { req }) => {
      if (req.body.discountType === "percentage" && (value < 0 || value > 100)) {
        throw new Error("Percentage discount must be between 0 and 100");
      }
      return true;
    }),

  body("maxDiscount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum discount must be a positive number"),

  body("minOrderAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum order amount must be a positive number"),

  body("validity.startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .toDate(),

  body("validity.endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid date")
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.validity.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  body("usageLimit.total")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total usage limit must be at least 1"),

  body("usageLimit.perUser")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Per user usage limit must be at least 1"),

  body("applicableCategories")
    .optional()
    .isArray()
    .withMessage("Applicable categories must be an array"),

  body("applicableCategories.*")
    .optional()
    .isMongoId()
    .withMessage("Each category ID must be a valid MongoDB ID"),

  body("applicableProducts")
    .optional()
    .isArray()
    .withMessage("Applicable products must be an array"),

  body("applicableProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each product ID must be a valid MongoDB ID"),

  body("excludedProducts")
    .optional()
    .isArray()
    .withMessage("Excluded products must be an array"),

  body("excludedProducts.*")
    .optional()
    .isMongoId()
    .withMessage("Each product ID must be a valid MongoDB ID"),

  body("eligibility.newUsersOnly")
    .optional()
    .isBoolean()
    .withMessage("New users only must be a boolean"),

  body("eligibility.membershipTiers")
    .optional()
    .isArray()
    .withMessage("Membership tiers must be an array"),

  body("eligibility.membershipTiers.*")
    .optional()
    .isString()
    .withMessage("Each membership tier must be a string")
    .isIn(["Bronze", "Silver", "Gold", "Emerald"])
    .withMessage("Invalid membership tier"),

  body("eligibility.specificUsers")
    .optional()
    .isArray()
    .withMessage("Specific users must be an array"),

  body("eligibility.specificUsers.*")
    .optional()
    .isMongoId()
    .withMessage("Each user ID must be a valid MongoDB ID"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Active status must be a boolean"),

  body("campaignType")
    .optional()
    .isIn(["promotional", "seasonal", "referral", "loyalty", "custom"])
    .withMessage("Invalid campaign type"),
];

/**
 * Validation for updating a coupon
 */
exports.validateUpdateCoupon = [
  body("code")
    .optional()
    .isString()
    .withMessage("Coupon code must be a string")
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Coupon code must be between 3 and 50 characters")
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage("Coupon code can only contain letters, numbers, hyphens, and underscores")
    .toUpperCase(),

  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  body("discountType")
    .optional()
    .isIn(["percentage", "fixed", "freeShipping"])
    .withMessage("Discount type must be percentage, fixed, or freeShipping"),

  body("discountValue")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount value must be a positive number")
    .custom((value, { req }) => {
      if (req.body.discountType === "percentage" && (value < 0 || value > 100)) {
        throw new Error("Percentage discount must be between 0 and 100");
      }
      return true;
    }),

  body("maxDiscount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Maximum discount must be a positive number"),

  body("minOrderAmount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Minimum order amount must be a positive number"),

  body("validity.startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date")
    .toDate(),

  body("validity.endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date")
    .toDate(),

  body("usageLimit.total")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Total usage limit must be at least 1"),

  body("usageLimit.perUser")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Per user usage limit must be at least 1"),

  body("applicableCategories")
    .optional()
    .isArray()
    .withMessage("Applicable categories must be an array"),

  body("applicableProducts")
    .optional()
    .isArray()
    .withMessage("Applicable products must be an array"),

  body("excludedProducts")
    .optional()
    .isArray()
    .withMessage("Excluded products must be an array"),

  body("eligibility.newUsersOnly")
    .optional()
    .isBoolean()
    .withMessage("New users only must be a boolean"),

  body("eligibility.membershipTiers")
    .optional()
    .isArray()
    .withMessage("Membership tiers must be an array"),

  body("eligibility.specificUsers")
    .optional()
    .isArray()
    .withMessage("Specific users must be an array"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("Active status must be a boolean"),

  body("campaignType")
    .optional()
    .isIn(["promotional", "seasonal", "referral", "loyalty", "custom"])
    .withMessage("Invalid campaign type"),
];

/**
 * Validation for coupon ID parameter
 */
exports.validateCouponId = [
  param("id")
    .notEmpty()
    .withMessage("Coupon ID is required")
    .isMongoId()
    .withMessage("Invalid coupon ID format"),
];
