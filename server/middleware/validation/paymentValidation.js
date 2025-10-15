const { body, validationResult } = require("express-validator");

// Validation for creating payment order
const validateCreateOrder = [
  body("amount")
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 1 })
    .withMessage("Amount must be at least ₹1"),
  
  body("currency")
    .optional()
    .isIn(["INR", "USD"])
    .withMessage("Currency must be INR or USD"),
    
  body("notes")
    .optional()
    .isObject()
    .withMessage("Notes must be an object"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation for payment verification
const validatePaymentVerification = [
  body("razorpay_order_id")
    .notEmpty()
    .withMessage("Razorpay order ID is required"),
    
  body("razorpay_payment_id")
    .notEmpty()
    .withMessage("Razorpay payment ID is required"),
    
  body("razorpay_signature")
    .notEmpty()
    .withMessage("Razorpay signature is required"),
    
  body("shippingAddressId")
    .isMongoId()
    .withMessage("Valid shipping address ID is required"),
    
  body("paymentMethodId")
    .optional()
    .isMongoId()
    .withMessage("Payment method ID must be valid"),
    
  body("couponCode")
    .optional()
    .isString()
    .trim()
    .withMessage("Coupon code must be a string"),
    
  body("customerNotes")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Customer notes must be less than 500 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Validation for refund
const validateRefund = [
  body("paymentId")
    .notEmpty()
    .withMessage("Payment ID is required"),
    
  body("amount")
    .optional()
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 1 })
    .withMessage("Refund amount must be at least ₹1"),
    
  body("notes")
    .optional()
    .isObject()
    .withMessage("Notes must be an object"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

module.exports = {
  validateCreateOrder,
  validatePaymentVerification,
  validateRefund,
};