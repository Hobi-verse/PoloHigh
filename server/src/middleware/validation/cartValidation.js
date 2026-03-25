const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation middleware for adding item to cart
 */
const validateCartItem = [
  body('productId')
    .notEmpty()
    .withMessage('Product identifier is required')
    .bail()
    .isString()
    .withMessage('Product identifier must be a string')
    .bail()
    .trim()
    .custom((value) => {
      if (mongoose.Types.ObjectId.isValid(value)) {
        return true;
      }

      if (typeof value === 'string' && value.trim().length >= 1) {
        return true;
      }

      throw new Error('Invalid product identifier format');
    }),

  body('variantSku')
    .notEmpty()
    .withMessage('Variant SKU is required')
    .isString()
    .withMessage('Variant SKU must be a string')
    .trim(),

  body('quantity')
    .optional()
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for updating cart item
 */
const validateCartItemUpdate = [
  param('itemId')
    .notEmpty()
    .withMessage('Item identifier is required')
    .bail()
    .isString()
    .withMessage('Item identifier must be a string')
    .bail()
    .trim()
    .custom((value) => {
      if (mongoose.Types.ObjectId.isValid(value)) {
        return true;
      }

      if (typeof value === 'string' && value.trim().length >= 1) {
        return true;
      }

      throw new Error('Invalid item identifier format');
    }),

  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for item ID parameter
 */
const validateItemId = [
  param('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for applying coupon
 */
const validateCoupon = [
  body('couponCode')
    .notEmpty()
    .withMessage('Coupon code is required')
    .isString()
    .withMessage('Coupon code must be a string')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Coupon code must be between 3 and 20 characters')
    .matches(/^[A-Z0-9_-]+$/i)
    .withMessage('Coupon code can only contain letters, numbers, hyphens, and underscores'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

/**
 * Validation middleware for bulk operations
 */
const validateBulkCartOperation = [
  body('items')
    .notEmpty()
    .withMessage('Items array is required')
    .isArray({ min: 1 })
    .withMessage('Items must be a non-empty array'),

  body('items.*.productId')
    .notEmpty()
    .withMessage('Product ID is required for each item')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  body('items.*.variantSku')
    .notEmpty()
    .withMessage('Variant SKU is required for each item')
    .isString()
    .withMessage('Variant SKU must be a string'),

  body('items.*.quantity')
    .notEmpty()
    .withMessage('Quantity is required for each item')
    .isInt({ min: 1, max: 99 })
    .withMessage('Quantity must be between 1 and 99'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateCartItem,
  validateCartItemUpdate,
  validateItemId,
  validateCoupon,
  validateBulkCartOperation
};
