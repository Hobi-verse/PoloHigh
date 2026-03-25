const Address = require('../models/Address');

/**
 * @desc    Get all addresses for user
 * @route   GET /api/addresses
 * @access  Private
 */
const getAddresses = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all addresses for user, sorted by default first
    const addresses = await Address.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        addresses: addresses.map(addr => ({
          id: addr._id,
          label: addr.label,
          recipient: addr.recipient,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          isDefault: addr.isDefault,
          type: addr.type,
          deliveryInstructions: addr.deliveryInstructions,
          formattedAddress: addr.getFormattedAddress(),
          createdAt: addr.createdAt,
          updatedAt: addr.updatedAt
        })),
        count: addresses.length
      }
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve addresses',
      error: error.message
    });
  }
};

/**
 * @desc    Get single address by ID
 * @route   GET /api/addresses/:id
 * @access  Private
 */
const getAddressById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find address and verify ownership
    const address = await Address.findOne({ _id: id, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        address: {
          id: address._id,
          label: address.label,
          recipient: address.recipient,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
          type: address.type,
          deliveryInstructions: address.deliveryInstructions,
          coordinates: address.coordinates,
          formattedAddress: address.getFormattedAddress(),
          createdAt: address.createdAt,
          updatedAt: address.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve address',
      error: error.message
    });
  }
};

/**
 * @desc    Get default address for user
 * @route   GET /api/addresses/default
 * @access  Private
 */
const getDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get default address
    const address = await Address.getDefaultAddress(userId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'No default address found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        address: {
          id: address._id,
          label: address.label,
          recipient: address.recipient,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
          type: address.type,
          deliveryInstructions: address.deliveryInstructions,
          formattedAddress: address.getFormattedAddress(),
          createdAt: address.createdAt,
          updatedAt: address.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Get default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve default address',
      error: error.message
    });
  }
};

/**
 * @desc    Create new address
 * @route   POST /api/addresses
 * @access  Private
 */
const createAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      label,
      recipient,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country = 'India',
      isDefault = false,
      type = 'home',
      deliveryInstructions,
      coordinates
    } = req.body;

    // Check if user already has addresses
    const existingAddressCount = await Address.countDocuments({ userId });

    // If this is the first address, make it default
    const shouldBeDefault = existingAddressCount === 0 || isDefault;

    // Create address
    const address = await Address.create({
      userId,
      label,
      recipient,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault: shouldBeDefault,
      type,
      deliveryInstructions,
      coordinates
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: {
        address: {
          id: address._id,
          label: address.label,
          recipient: address.recipient,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
          type: address.type,
          deliveryInstructions: address.deliveryInstructions,
          formattedAddress: address.getFormattedAddress(),
          createdAt: address.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Create address error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message
    });
  }
};

/**
 * @desc    Update address
 * @route   PUT /api/addresses/:id
 * @access  Private
 */
const updateAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const updateData = req.body;

    // Find address and verify ownership
    const address = await Address.findOne({ _id: id, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'label',
      'recipient',
      'phone',
      'addressLine1',
      'addressLine2',
      'city',
      'state',
      'postalCode',
      'country',
      'isDefault',
      'type',
      'deliveryInstructions',
      'coordinates'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        address[field] = updateData[field];
      }
    });

    await address.save();

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: {
          id: address._id,
          label: address.label,
          recipient: address.recipient,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
          type: address.type,
          deliveryInstructions: address.deliveryInstructions,
          formattedAddress: address.getFormattedAddress(),
          createdAt: address.createdAt,
          updatedAt: address.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Update address error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
};

/**
 * @desc    Set address as default
 * @route   PATCH /api/addresses/:id/set-default
 * @access  Private
 */
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find address and verify ownership
    const address = await Address.findOne({ _id: id, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // Set as default (pre-save hook will handle removing default from others)
    address.isDefault = true;
    await address.save();

    res.status(200).json({
      success: true,
      message: 'Default address updated',
      data: {
        address: {
          id: address._id,
          label: address.label,
          recipient: address.recipient,
          isDefault: address.isDefault,
          formattedAddress: address.getFormattedAddress()
        }
      }
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: error.message
    });
  }
};

/**
 * @desc    Delete address
 * @route   DELETE /api/addresses/:id
 * @access  Private
 */
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    // Find address and verify ownership
    const address = await Address.findOne({ _id: id, userId });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;

    // Delete address
    await address.deleteOne();

    // If deleted address was default, make another address default
    if (wasDefault) {
      const nextAddress = await Address.findOne({ userId }).sort({ createdAt: -1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message
    });
  }
};

/**
 * @desc    Validate PIN code
 * @route   POST /api/addresses/validate-pincode
 * @access  Private
 */
const validatePinCode = async (req, res) => {
  try {
    const { postalCode, state } = req.body;

    if (!postalCode) {
      return res.status(400).json({
        success: false,
        message: 'Postal code is required'
      });
    }

    // Basic validation - check format (6 digits)
    const isValid = /^\d{6}$/.test(postalCode);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PIN code format. Must be 6 digits.'
      });
    }

    // TODO: Integrate with actual PIN code database API for detailed validation
    // For now, just return basic validation result

    res.status(200).json({
      success: true,
      data: {
        valid: isValid,
        postalCode,
        // In future, can return: city, state, district, deliverable, etc.
      }
    });
  } catch (error) {
    console.error('Validate PIN code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate PIN code',
      error: error.message
    });
  }
};

module.exports = {
  getAddresses,
  getAddressById,
  getDefaultAddress,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  validatePinCode
};
