const express = require("express");
const router = express.Router();
const {
  createReview,
  getProductReviews,
  getUserReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  removeReviewHelpful,
  getAllReviews,
  approveReview,
  rejectReview,
  respondToReview,
  canReviewProduct,
} = require("../Controllers/reviewController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  validateCreateReview,
  validateUpdateReview,
  validateReviewId,
  validateRejectReview,
  validateAdminResponse,
} = require("../middleware/validation/reviewValidation");

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get all approved reviews for a product
 * @access  Public
 * @query   page, limit, rating, sortBy, sortOrder, verified
 */
router.get("/product/:productId", getProductReviews);

// ============================================
// USER ROUTES (Protected)
// ============================================

/**
 * @route   POST /api/reviews
 * @desc    Create a new review
 * @access  Private
 * @body    { productId, orderId?, rating, title?, comment, images?, variant? }
 */
router.post("/", protect, validateCreateReview, createReview);

/**
 * @route   GET /api/reviews/user
 * @desc    Get logged-in user's reviews
 * @access  Private
 * @query   page, limit
 */
router.get("/user", protect, getUserReviews);

/**
 * @route   GET /api/reviews/can-review/:productId
 * @desc    Check if user can review a product
 * @access  Private
 */
router.get("/can-review/:productId", protect, canReviewProduct);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update user's own review
 * @access  Private
 * @body    { rating?, title?, comment?, images?, variant? }
 */
router.put("/:id", protect, validateReviewId, validateUpdateReview, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete user's own review
 * @access  Private
 */
router.delete("/:id", protect, validateReviewId, deleteReview);

/**
 * @route   PATCH /api/reviews/:id/helpful
 * @desc    Mark review as helpful
 * @access  Private
 */
router.patch("/:id/helpful", protect, validateReviewId, markReviewHelpful);

/**
 * @route   DELETE /api/reviews/:id/helpful
 * @desc    Remove helpful mark from review
 * @access  Private
 */
router.delete("/:id/helpful", protect, validateReviewId, removeReviewHelpful);

// ============================================
// ADMIN ROUTES (Protected + Admin Only)
// ============================================

/**
 * @route   GET /api/reviews/admin/all
 * @desc    Get all reviews (Admin)
 * @access  Private (Admin)
 * @query   status, rating, verified, page, limit, sortBy, sortOrder, search
 */
router.get("/admin/all", protect, restrictTo("admin"), getAllReviews);

/**
 * @route   PATCH /api/reviews/:id/approve
 * @desc    Approve a review (Admin)
 * @access  Private (Admin)
 */
router.patch(
  "/:id/approve",
  protect,
  restrictTo("admin"),
  validateReviewId,
  approveReview
);

/**
 * @route   PATCH /api/reviews/:id/reject
 * @desc    Reject a review (Admin)
 * @access  Private (Admin)
 * @body    { reason? }
 */
router.patch(
  "/:id/reject",
  protect,
  restrictTo("admin"),
  validateReviewId,
  validateRejectReview,
  rejectReview
);

/**
 * @route   PATCH /api/reviews/:id/respond
 * @desc    Add admin response to review (Admin)
 * @access  Private (Admin)
 * @body    { message }
 */
router.patch(
  "/:id/respond",
  protect,
  restrictTo("admin"),
  validateReviewId,
  validateAdminResponse,
  respondToReview
);

module.exports = router;
