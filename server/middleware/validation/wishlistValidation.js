const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Validation middleware for adding item to wishlist
 */
const validateWishlistItem = [
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

      if (typeof value === 'string' && value.length >= 3) {
        return true;
      }

      throw new Error('Invalid product identifier format');
    }),

  body('variantSku')
    .optional()
    .isString()
    .withMessage('Variant SKU must be a string')
    .trim(),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

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
 * Validation middleware for updating wishlist item
 */
const validateWishlistItemUpdate = [
  param('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),

  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters'),

  body('variantSku')
    .optional()
    .isString()
    .withMessage('Variant SKU must be a string')
    .trim(),

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
 * Validation middleware for product ID parameter
 */
const validateProductId = [
  param('productId')
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

      if (typeof value === 'string' && value.length >= 3) {
        return true;
      }

      throw new Error('Invalid product identifier format');
    }),

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
 * Validation middleware for move to cart
 */
const validateMoveToCart = [
  param('itemId')
    .notEmpty()
    .withMessage('Item ID is required')
    .isMongoId()
    .withMessage('Invalid item ID format'),

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

module.exports = {
  validateWishlistItem,
  validateWishlistItemUpdate,
  validateItemId,
  validateProductId,
  validateMoveToCart
};
