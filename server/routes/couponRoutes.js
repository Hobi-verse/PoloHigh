const express = require("express");
const router = express.Router();
const {
  validateCoupon,
  getAvailableCoupons,
  getUserCouponUsage,
  autoApplyBestCoupon,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponAnalytics,
} = require("../Controllers/couponController");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const {
  validateCouponCode,
  validateCouponApplication,
  validateCreateCoupon,
  validateUpdateCoupon,
  validateCouponId,
} = require("../middleware/validation/couponValidation");

// =============================================
// PUBLIC & USER ROUTES
// =============================================

// @route   POST /api/coupons/validate
// @desc    Validate and apply coupon code
// @access  Private (Customer)
router.post("/validate", protect, validateCouponApplication, validateCoupon);

// @route   GET /api/coupons/available
// @desc    Get all available coupons for user
// @access  Private (Customer)
router.get("/available", protect, getAvailableCoupons);

// @route   GET /api/coupons/my-usage
// @desc    Get user's coupon usage history
// @access  Private (Customer)
router.get("/my-usage", protect, getUserCouponUsage);

// @route   POST /api/coupons/auto-apply
// @desc    Auto-apply best coupon for cart
// @access  Private (Customer)
router.post("/auto-apply", protect, validateCouponApplication, autoApplyBestCoupon);

// =============================================
// ADMIN ROUTES
// =============================================

// @route   POST /api/coupons/admin/create
// @desc    Create new coupon
// @access  Private (Admin)
router.post(
  "/admin/create",
  protect,
  restrictTo("admin"),
  validateCreateCoupon,
  createCoupon
);

// @route   GET /api/coupons/admin/all
// @desc    Get all coupons (admin view)
// @access  Private (Admin)
router.get("/admin/all", protect, restrictTo("admin"), getAllCoupons);

// @route   GET /api/coupons/admin/analytics
// @desc    Get coupon analytics
// @access  Private (Admin)
router.get("/admin/analytics", protect, restrictTo("admin"), getCouponAnalytics);

// @route   GET /api/coupons/admin/:id
// @desc    Get single coupon details
// @access  Private (Admin)
router.get("/admin/:id", protect, restrictTo("admin"), validateCouponId, getCouponById);

// @route   PUT /api/coupons/admin/:id
// @desc    Update coupon
// @access  Private (Admin)
router.put(
  "/admin/:id",
  protect,
  restrictTo("admin"),
  validateCouponId,
  validateUpdateCoupon,
  updateCoupon
);

// @route   DELETE /api/coupons/admin/:id
// @desc    Delete coupon
// @access  Private (Admin)
router.delete(
  "/admin/:id",
  protect,
  restrictTo("admin"),
  validateCouponId,
  deleteCoupon
);

// @route   PATCH /api/coupons/admin/:id/toggle-status
// @desc    Toggle coupon active status
// @access  Private (Admin)
router.patch(
  "/admin/:id/toggle-status",
  protect,
  restrictTo("admin"),
  validateCouponId,
  toggleCouponStatus
);

module.exports = router;
