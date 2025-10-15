const express = require('express');
const router = express.Router();
const {
  getAddresses,
  getAddressById,
  getDefaultAddress,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  validatePinCode
} = require('../Controllers/addressController');
const { protect } = require('../middleware/authMiddleware');
const {
  validateAddress,
  validateAddressUpdate,
  validatePinCodeRequest
} = require('../middleware/validation/addressValidation');

// All address routes require authentication
router.use(protect);

// @route   GET /api/addresses
// @desc    Get all addresses for user
// @access  Private
router.get('/', getAddresses);

// @route   GET /api/addresses/default
// @desc    Get default address
// @access  Private
router.get('/default', getDefaultAddress);

// @route   POST /api/addresses/validate-pincode
// @desc    Validate PIN code
// @access  Private
router.post('/validate-pincode', validatePinCodeRequest, validatePinCode);

// @route   GET /api/addresses/:id
// @desc    Get single address by ID
// @access  Private
router.get('/:id', getAddressById);

// @route   POST /api/addresses
// @desc    Create new address
// @access  Private
router.post('/', validateAddress, createAddress);

// @route   PUT /api/addresses/:id
// @desc    Update address
// @access  Private
router.put('/:id', validateAddressUpdate, updateAddress);

// @route   PATCH /api/addresses/:id/set-default
// @desc    Set address as default
// @access  Private
router.patch('/:id/set-default', setDefaultAddress);

// @route   DELETE /api/addresses/:id
// @desc    Delete address
// @access  Private
router.delete('/:id', deleteAddress);

module.exports = router;
