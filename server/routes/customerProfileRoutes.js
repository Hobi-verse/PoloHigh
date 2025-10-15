const express = require("express");
const router = express.Router();
const {
  getProfile,
  getAccountSummary,
  updateProfile,
  updatePreferences,
  getMembership,
  getRewards,
  redeemPoints,
  getReferral,
  applyReferral,
  getSecurity,
  toggle2FA,
  addTrustedDevice,
  removeTrustedDevice,
} = require("../Controllers/customerProfileController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateUpdateProfile,
  validateUpdatePreferences,
  validateRedeemPoints,
  validateApplyReferral,
  validateToggle2FA,
  validateAddDevice,
  validateDeviceId,
} = require("../middleware/validation/customerProfileValidation");

// ============================================
// PROFILE ROUTES (All Protected)
// ============================================

/**
 * @route   GET /api/profile
 * @desc    Get customer profile
 * @access  Private
 */
router.get("/", protect, getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update customer profile
 * @access  Private
 * @body    { birthday?, avatar? }
 */
router.put("/", protect, validateUpdateProfile, updateProfile);

/**
 * @route   GET /api/profile/summary
 * @desc    Get account summary (for My Account page)
 * @access  Private
 */
router.get("/summary", protect, getAccountSummary);

// ============================================
// PREFERENCES ROUTES
// ============================================

/**
 * @route   PATCH /api/profile/preferences
 * @desc    Update notification and other preferences
 * @access  Private
 * @body    { marketingEmails?, smsUpdates?, whatsappUpdates?, etc. }
 */
router.patch(
  "/preferences",
  protect,
  validateUpdatePreferences,
  updatePreferences
);

// ============================================
// MEMBERSHIP ROUTES
// ============================================

/**
 * @route   GET /api/profile/membership
 * @desc    Get membership tier and benefits
 * @access  Private
 */
router.get("/membership", protect, getMembership);

// ============================================
// REWARDS & WALLET ROUTES
// ============================================

/**
 * @route   GET /api/profile/rewards
 * @desc    Get reward points and wallet balance
 * @access  Private
 */
router.get("/rewards", protect, getRewards);

/**
 * @route   POST /api/profile/rewards/redeem
 * @desc    Redeem reward points to wallet
 * @access  Private
 * @body    { points }
 */
router.post("/rewards/redeem", protect, validateRedeemPoints, redeemPoints);

// ============================================
// REFERRAL ROUTES
// ============================================

/**
 * @route   GET /api/profile/referral
 * @desc    Get referral code and statistics
 * @access  Private
 */
router.get("/referral", protect, getReferral);

/**
 * @route   POST /api/profile/referral/apply
 * @desc    Apply referral code (for new users)
 * @access  Private
 * @body    { referralCode }
 */
router.post("/referral/apply", protect, validateApplyReferral, applyReferral);

// ============================================
// SECURITY ROUTES
// ============================================

/**
 * @route   GET /api/profile/security
 * @desc    Get security settings and trusted devices
 * @access  Private
 */
router.get("/security", protect, getSecurity);

/**
 * @route   PATCH /api/profile/security/2fa
 * @desc    Enable/disable two-factor authentication
 * @access  Private
 * @body    { enabled }
 */
router.patch("/security/2fa", protect, validateToggle2FA, toggle2FA);

/**
 * @route   POST /api/profile/security/device
 * @desc    Add/update trusted device
 * @access  Private
 * @body    { deviceId, deviceName, location?, userAgent? }
 */
router.post("/security/device", protect, validateAddDevice, addTrustedDevice);

/**
 * @route   DELETE /api/profile/security/device/:deviceId
 * @desc    Remove trusted device
 * @access  Private
 */
router.delete(
  "/security/device/:deviceId",
  protect,
  validateDeviceId,
  removeTrustedDevice
);

module.exports = router;
