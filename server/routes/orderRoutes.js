const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getAllOrders,
  confirmPayment,
} = require("../Controllers/orderController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateCancelOrder,
  validateOrderId,
} = require("../middleware/validation/orderValidation");

// ============================================
// USER ROUTES (Protected)
// ============================================

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics for logged-in user
 * @access  Private
 */
router.get("/stats", protect, getOrderStats);

/**
 * @route   GET /api/orders
 * @desc    Get all orders for logged-in user
 * @access  Private
 * @query   status, page, limit, sortBy, sortOrder
 */
router.get("/", protect, getOrders);

/**
 * @route   POST /api/orders
 * @desc    Create new order from cart
 * @access  Private
 * @body    { addressId, paymentMethod, paymentMethodId?, customerNotes? }
 */
router.post("/", protect, validateCreateOrder, createOrder);

/**
 * @route   GET /api/orders/:id
 * @desc    Get single order by ID
 * @access  Private (Own orders only)
 */
router.get("/:id", protect, validateOrderId, getOrderById);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel order (only if pending/confirmed/processing)
 * @access  Private (Own orders only)
 * @body    { reason? }
 */
router.patch("/:id/cancel", protect, validateOrderId, validateCancelOrder, cancelOrder);

// ============================================
// ADMIN ROUTES (Protected + Admin Only)
// ============================================

/**
 * @route   GET /api/orders/admin/all
 * @desc    Get all orders (Admin)
 * @access  Private (Admin)
 * @query   status, page, limit, sortBy, sortOrder, search
 */
router.get("/admin/all", protect, restrictTo("admin"), getAllOrders);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order status (Admin)
 * @access  Private (Admin)
 * @body    { status, trackingNumber?, courierService? }
 */
router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  validateOrderId,
  validateUpdateOrderStatus,
  updateOrderStatus
);

/**
 * @route   PATCH /api/orders/:id/confirm-payment
 * @desc    Confirm payment for order (Admin/Webhook)
 * @access  Private (Admin)
 * @body    { transactionId? }
 */
router.patch(
  "/:id/confirm-payment",
  protect,
  restrictTo("admin"),
  validateOrderId,
  confirmPayment
);

module.exports = router;
