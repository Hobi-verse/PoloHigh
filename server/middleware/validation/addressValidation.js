const { body, param, validationResult } = require('express-validator');

/**
 * Validation middleware for creating address
 */
const validateAddress = [
  body('label')
    .optional()
    .isString()
    .withMessage('Label must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Label must be between 1 and 50 characters'),

  body('recipient')
    .notEmpty()
    .withMessage('Recipient name is required')
    .isString()
    .withMessage('Recipient must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),

  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .trim()
    .matches(/^(\+91[\s]?)?[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian mobile number (10 digits starting with 6-9)'),

  body('addressLine1')
    .notEmpty()
    .withMessage('Address line 1 is required')
    .isString()
    .withMessage('Address line 1 must be a string')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),

  body('addressLine2')
    .optional()
    .isString()
    .withMessage('Address line 2 must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 cannot exceed 200 characters'),

  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isString()
    .withMessage('City must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),

  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isString()
    .withMessage('State must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),

  body('postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Postal code must be a valid 6-digit PIN code'),

  body('country')
    .optional()
    .isString()
    .withMessage('Country must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  body('type')
    .optional()
    .isIn(['home', 'office', 'other'])
    .withMessage('Type must be home, office, or other'),

  body('deliveryInstructions')
    .optional()
    .isString()
    .withMessage('Delivery instructions must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Delivery instructions cannot exceed 500 characters'),

  body('coordinates')
    .optional()
    .isObject()
    .withMessage('Coordinates must be an object'),

  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

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
 * Validation middleware for updating address
 */
const validateAddressUpdate = [
  param('id')
    .notEmpty()
    .withMessage('Address ID is required')
    .isMongoId()
    .withMessage('Invalid address ID format'),

  body('label')
    .optional()
    .isString()
    .withMessage('Label must be a string')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Label must be between 1 and 50 characters'),

  body('recipient')
    .optional()
    .isString()
    .withMessage('Recipient must be a string')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Recipient name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^(\+91[\s]?)?[6-9]\d{9}$/)
    .withMessage('Please provide a valid Indian mobile number (10 digits starting with 6-9)'),

  body('addressLine1')
    .optional()
    .isString()
    .withMessage('Address line 1 must be a string')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address line 1 must be between 5 and 200 characters'),

  body('addressLine2')
    .optional()
    .isString()
    .withMessage('Address line 2 must be a string')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address line 2 cannot exceed 200 characters'),

  body('city')
    .optional()
    .isString()
    .withMessage('City must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),

  body('state')
    .optional()
    .isString()
    .withMessage('State must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('State must be between 2 and 50 characters'),

  body('postalCode')
    .optional()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Postal code must be a valid 6-digit PIN code'),

  body('country')
    .optional()
    .isString()
    .withMessage('Country must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),

  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),

  body('type')
    .optional()
    .isIn(['home', 'office', 'other'])
    .withMessage('Type must be home, office, or other'),

  body('deliveryInstructions')
    .optional()
    .isString()
    .withMessage('Delivery instructions must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Delivery instructions cannot exceed 500 characters'),

  body('coordinates')
    .optional()
    .isObject()
    .withMessage('Coordinates must be an object'),

  body('coordinates.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),

  body('coordinates.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),

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
 * Validation middleware for address ID parameter
 */
const validateAddressId = [
  param('id')
    .notEmpty()
    .withMessage('Address ID is required')
    .isMongoId()
    .withMessage('Invalid address ID format'),

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
 * Validation middleware for PIN code validation request
 */
const validatePinCodeRequest = [
  body('postalCode')
    .notEmpty()
    .withMessage('Postal code is required')
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('Postal code must be a valid 6-digit PIN code'),

  body('state')
    .optional()
    .isString()
    .withMessage('State must be a string')
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

module.exports = {
  validateAddress,
  validateAddressUpdate,
  validateAddressId,
  validatePinCodeRequest
};
