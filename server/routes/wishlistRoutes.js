const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addWishlistItem,
  updateWishlistItem,
  removeWishlistItem,
  clearWishlist,
  moveToCart,
  checkProductInWishlist,
  getWishlistSummary,
  syncWishlist
} = require('../Controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');
const { validateWishlistItem, validateWishlistItemUpdate } = require('../middleware/validation/wishlistValidation');

// All wishlist routes require authentication
router.use(protect);

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', getWishlist);

// @route   GET /api/wishlist/summary
// @desc    Get wishlist summary (for header badge)
// @access  Private
router.get('/summary', getWishlistSummary);

// @route   POST /api/wishlist/sync
// @desc    Sync wishlist stock and prices
// @access  Private
router.post('/sync', syncWishlist);

// @route   GET /api/wishlist/check/:productId
// @desc    Check if product is in wishlist
// @access  Private
router.get('/check/:productId', checkProductInWishlist);

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post('/', validateWishlistItem, addWishlistItem);

// @route   PATCH /api/wishlist/:itemId
// @desc    Update wishlist item
// @access  Private
router.patch('/:itemId', validateWishlistItemUpdate, updateWishlistItem);

// @route   DELETE /api/wishlist/:itemId
// @desc    Remove item from wishlist
// @access  Private
router.delete('/:itemId', removeWishlistItem);

// @route   POST /api/wishlist/:itemId/move-to-cart
// @desc    Move wishlist item to cart
// @access  Private
router.post('/:itemId/move-to-cart', moveToCart);

// @route   DELETE /api/wishlist
// @desc    Clear entire wishlist
// @access  Private
router.delete('/', clearWishlist);

module.exports = router;
