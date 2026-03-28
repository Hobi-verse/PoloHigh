const { body, param, validationResult } = require("express-validator");

/**
 * Validation middleware for updating profile
 */
exports.validateUpdateProfile = [
  body("birthday")
    .optional()
    .isISO8601()
    .withMessage("Birthday must be a valid date")
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 13 || age > 120) {
        throw new Error("Age must be between 13 and 120 years");
      }
      return true;
    }),

  body("avatar")
    .optional()
    .isObject()
    .withMessage("Avatar must be an object"),

  body("avatar.url")
    .optional()
    .isURL()
    .withMessage("Avatar URL must be valid"),

  body("avatar.cloudinaryId")
    .optional()
    .isString()
    .withMessage("Cloudinary ID must be a string"),

  body("fullName")
    .optional()
    .isString()
    .withMessage("Full name must be a string")
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Full name must be between 2 and 80 characters"),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Email must be valid")
    .normalizeEmail(),

  body("mobileNumber")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be a valid 10-digit number"),

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
 * Validation middleware for updating preferences
 */
exports.validateUpdatePreferences = [
  body("marketingEmails")
    .optional()
    .isBoolean()
    .withMessage("Marketing emails preference must be boolean"),

  body("smsUpdates")
    .optional()
    .isBoolean()
    .withMessage("SMS updates preference must be boolean"),

  body("whatsappUpdates")
    .optional()
    .isBoolean()
    .withMessage("WhatsApp updates preference must be boolean"),

  body("orderReminders")
    .optional()
    .isBoolean()
    .withMessage("Order reminders preference must be boolean"),

  body("securityAlerts")
    .optional()
    .isBoolean()
    .withMessage("Security alerts preference must be boolean"),

  body("language")
    .optional()
    .isString()
    .withMessage("Language must be a string")
    .isLength({ min: 2, max: 5 })
    .withMessage("Language code must be 2-5 characters"),

  body("currency")
    .optional()
    .isString()
    .withMessage("Currency must be a string")
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency code must be 3 characters"),

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
 * Validation middleware for toggling 2FA
 */
exports.validateToggle2FA = [
  body("enabled")
    .notEmpty()
    .withMessage("Enabled status is required")
    .isBoolean()
    .withMessage("Enabled must be a boolean"),

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
 * Validation middleware for adding trusted device
 */
exports.validateAddDevice = [
  body("deviceId")
    .notEmpty()
    .withMessage("Device ID is required")
    .isString()
    .withMessage("Device ID must be a string")
    .isLength({ min: 5, max: 100 })
    .withMessage("Device ID must be 5-100 characters"),

  body("deviceName")
    .notEmpty()
    .withMessage("Device name is required")
    .isString()
    .withMessage("Device name must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("Device name must be 2-100 characters"),

  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string")
    .isLength({ max: 200 })
    .withMessage("Location cannot exceed 200 characters"),

  body("userAgent")
    .optional()
    .isString()
    .withMessage("User agent must be a string")
    .isLength({ max: 500 })
    .withMessage("User agent cannot exceed 500 characters"),

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
 * Validation middleware for device ID parameter
 */
exports.validateDeviceId = [
  param("deviceId")
    .notEmpty()
    .withMessage("Device ID is required")
    .isString()
    .withMessage("Device ID must be a string"),

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
