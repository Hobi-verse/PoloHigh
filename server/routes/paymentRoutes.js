const express = require("express");
const router = express.Router();
const {
  createOrder,
  verifyPaymentAndCreateOrder,
  getPaymentStatus,
  reportPaymentFailure,
  requestRefund,
  handleWebhook,
} = require("../Controllers/paymentController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

// Public routes
router.post("/webhook", handleWebhook); // Webhook should be public

// Protected routes (require authentication)
router.use(protect); // Apply authentication middleware to all routes below

// Create Stripe Payment Intent (Step 1 - Secure)
router.post("/create-order", createOrder);

// Verify Stripe payment and create order (Step 2 - Secure)
router.post("/verify-payment", verifyPaymentAndCreateOrder);

// Get payment status
router.get("/status/:paymentId", getPaymentStatus);

// Handle payment failure
router.post("/failure", reportPaymentFailure);

// Refund payment (admin only)
router.post("/refund", restrictTo("admin"), requestRefund);

module.exports = router;