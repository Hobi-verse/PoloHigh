const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPaymentAndCreateOrder,
  getPaymentStatus,
  handlePaymentFailure,
  refundPayment,
  handleWebhook,
} = require("../Controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateCreateOrder,
  validatePaymentVerification,
  validateRefund,
} = require("../middleware/validation/paymentValidation");

// Public routes
router.post("/webhook", handleWebhook); // Webhook should be public

// Protected routes (require authentication)
router.use(protect); // Apply authentication middleware to all routes below

// Create Razorpay order
router.post("/create-order", validateCreateOrder, createOrder);

// Verify payment and create order
router.post("/verify-payment", validatePaymentVerification, verifyPaymentAndCreateOrder);

// Get payment status
router.get("/status/:paymentId", getPaymentStatus);

// Handle payment failure
router.post("/failure", handlePaymentFailure);

// Refund payment (admin only - you might want to add admin middleware)
router.post("/refund", validateRefund, refundPayment);

module.exports = router;