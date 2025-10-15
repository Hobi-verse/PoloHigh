const express = require('express');
const router = express.Router();
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  saveItemForLater,
  moveItemToCart,
  clearCart,
  getCartSummary,
  validateCart
} = require('../Controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { validateCartItem, validateCartItemUpdate } = require('../middleware/validation/cartValidation');

// All cart routes require authentication
router.use(protect);

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', getCart);

// @route   GET /api/cart/summary
// @desc    Get cart summary (for header badge)
// @access  Private
router.get('/summary', getCartSummary);

// @route   POST /api/cart/validate
// @desc    Validate cart items (stock, prices)
// @access  Private
router.post('/validate', validateCart);

// @route   POST /api/cart/items
// @desc    Add item to cart
// @access  Private
router.post('/items', validateCartItem, addCartItem);

// @route   PATCH /api/cart/items/:itemId
// @desc    Update cart item quantity
// @access  Private
router.patch('/items/:itemId', validateCartItemUpdate, updateCartItem);

// @route   DELETE /api/cart/items/:itemId
// @desc    Remove item from cart
// @access  Private
router.delete('/items/:itemId', removeCartItem);

// @route   PATCH /api/cart/items/:itemId/save-for-later
// @desc    Save item for later
// @access  Private
router.patch('/items/:itemId/save-for-later', saveItemForLater);

// @route   PATCH /api/cart/items/:itemId/move-to-cart
// @desc    Move saved item back to cart
// @access  Private
router.patch('/items/:itemId/move-to-cart', moveItemToCart);

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Private
router.delete('/', clearCart);

module.exports = router;
