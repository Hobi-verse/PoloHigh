const mongoose = require('mongoose');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const normalizeProductIdentifier = async (identifier) => {
  if (!identifier) {
    return null;
  }

  let product = null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    product = await Product.findById(identifier);
  }

  if (!product) {
    product = await Product.findOne({ slug: identifier });
  }

  return product;
};

const resolveVariantPrice = (product, variant) => {
  const candidateValues = [
    variant?.priceOverride,
    variant?.price,
    product?.salePrice,
    product?.basePrice,
    product?.price,
  ];

  const numeric = candidateValues.find((value) => Number.isFinite(Number(value)));
  return Number(numeric ?? 0);
};

const formatWishlistItem = (item) => {
  if (!item) {
    return null;
  }

  let productIdentifier = item.productSlug || null;
  const rawProduct = item.productId;

  if (!productIdentifier) {
    if (typeof rawProduct === 'string') {
      productIdentifier = rawProduct;
    } else if (rawProduct?.slug) {
      productIdentifier = rawProduct.slug;
    } else if (rawProduct?._id) {
      productIdentifier = rawProduct._id.toString();
    } else if (typeof rawProduct?.toString === 'function') {
      productIdentifier = rawProduct.toString();
    }
  }

  const normalizedPrice = Number(item.price);

  return {
    id: item._id?.toString?.() || item.id || productIdentifier || item.variantSku,
    productId: productIdentifier,
    title: item.title,
    price: Number.isFinite(normalizedPrice) ? normalizedPrice : 0,
    size: item.size ?? null,
    color: item.color ?? null,
    imageUrl: item.imageUrl ?? null,
    inStock: item.inStock !== false,
    priority: item.priority ?? 'medium',
    notes: item.notes ?? '',
    addedAt: item.addedAt ?? null,
    variantSku: item.variantSku ?? null,
  };
};

const formatWishlistResponse = (wishlist) => {
  if (!wishlist) {
    return {
      id: null,
      name: '',
      isPublic: false,
      items: [],
      itemCount: 0,
      lastActivityAt: null,
    };
  }

  return {
    id: wishlist._id?.toString?.() || wishlist.id || null,
    name: wishlist.name || 'My Wishlist',
    isPublic: Boolean(wishlist.isPublic),
    items: Array.isArray(wishlist.items)
      ? wishlist.items.map(formatWishlistItem).filter(Boolean)
      : [],
    itemCount: Number.isFinite(Number(wishlist.itemCount))
      ? Number(wishlist.itemCount)
      : Array.isArray(wishlist.items)
        ? wishlist.items.length
        : 0,
    lastActivityAt: wishlist.lastActivityAt || null,
  };
};

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
const getWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ userId }).populate('items.productId', 'title slug price salePrice brand category media variants totalStock');

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId });
    }

    // Update stock status and prices for all items
    await wishlist.updateItemStock();
    await wishlist.save();

    res.status(200).json({
      success: true,
      data: {
        wishlist: formatWishlistResponse(wishlist)
      }
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Add item to wishlist
 * @route   POST /api/wishlist
 * @access  Private
 */
const addWishlistItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantSku, priority = 'medium', notes } = req.body;

    // Validate input
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Find product
    const product = await normalizeProductIdentifier(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get or create wishlist
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId });
    }

    // Prepare item data
    let itemData = {
      productId: product._id,
      productSlug: product.slug,
      title: product.title,
      price: resolveVariantPrice(product),
      imageUrl: product.media.find(m => m.isPrimary)?.url || product.media[0]?.url,
      inStock: product.totalStock > 0,
      priority,
      notes
    };

    // If variant specified, get variant details
    if (variantSku) {
      const variant = product.variants.find(v => v.sku === variantSku);
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }

      itemData.variantSku = variant.sku;
      itemData.size = variant.size;
      itemData.color = variant.color.name;
      itemData.price = resolveVariantPrice(product, variant);
      itemData.inStock = variant.stockLevel > 0;
    }

    // Add item using model method
    const isAdded = wishlist.addItem(itemData);

    if (!isAdded) {
      return res.status(400).json({
        success: false,
        message: 'Item already exists in wishlist'
      });
    }

    await wishlist.save();

    res.status(201).json({
      success: true,
      message: 'Item added to wishlist',
      data: {
        wishlist: formatWishlistResponse(wishlist)
      }
    });
  } catch (error) {
    console.error('Add wishlist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Update wishlist item
 * @route   PATCH /api/wishlist/:itemId
 * @access  Private
 */
const updateWishlistItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { priority, notes, variantSku } = req.body;

    // Find wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Find item
    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    // Update fields
    if (priority) {
      item.priority = priority;
    }
    if (notes !== undefined) {
      item.notes = notes;
    }

    // Update variant if specified
    if (variantSku) {
      const product = await Product.findById(item.productId);
      if (product) {
        const variant = product.variants.find(v => v.sku === variantSku);
        if (variant) {
          item.variantSku = variant.sku;
          item.size = variant.size;
          item.color = variant.color.name;
          item.price = resolveVariantPrice(product, variant);
          item.inStock = variant.stockLevel > 0;
          item.productSlug = product.slug || item.productSlug;
        }
      }
    }

    wishlist.lastActivityAt = new Date();
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist item updated',
      data: {
        wishlist: formatWishlistResponse(wishlist)
      }
    });
  } catch (error) {
    console.error('Update wishlist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update wishlist item',
      error: error.message
    });
  }
};

/**
 * @desc    Remove item from wishlist
 * @route   DELETE /api/wishlist/:itemId
 * @access  Private
 */
const removeWishlistItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    // Find wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Check if item exists
    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    // Remove item
    wishlist.removeItem(itemId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from wishlist',
      data: {
        wishlist: formatWishlistResponse(wishlist)
      }
    });
  } catch (error) {
    console.error('Remove wishlist item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Clear entire wishlist
 * @route   DELETE /api/wishlist
 * @access  Private
 */
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Clear wishlist
    wishlist.clearWishlist();
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist cleared',
      data: {
        wishlist: formatWishlistResponse(wishlist)
      }
    });
  } catch (error) {
    console.error('Clear wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Move wishlist item to cart
 * @route   POST /api/wishlist/:itemId/move-to-cart
 * @access  Private
 */
const moveToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity = 1 } = req.body;

    // Find wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Find item
    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in wishlist'
      });
    }

    // Check if variant is specified
    if (!item.variantSku) {
      return res.status(400).json({
        success: false,
        message: 'Please select a size and color before adding to cart'
      });
    }

    // Find product and variant
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variant = product.variants.find(v => v.sku === item.variantSku);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Check stock
    if (variant.stockLevel < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stockLevel} items available in stock`
      });
    }

    // Import Cart model
    const Cart = require('../models/Cart');

    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Add to cart
    const cartItemData = {
      productId: product._id,
      productSlug: product.slug,
      variantSku: variant.sku,
      title: product.title,
      price: resolveVariantPrice(product, variant),
      size: variant.size,
      color: variant.color.name,
      imageUrl: product.media.find(m => m.isPrimary)?.url || product.media[0]?.url,
      quantity: quantity
    };

    cart.addItem(cartItemData);
    await cart.save();

    // Optionally remove from wishlist
    wishlist.removeItem(itemId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Item moved to cart',
      data: {
        cart: {
          id: cart._id,
          itemCount: cart.totals?.itemCount ?? 0,
          totals: cart.totals || { subtotal: 0, itemCount: 0, savedItemCount: 0 }
        },
        wishlist: formatWishlistResponse(wishlist)
      }
    });
  } catch (error) {
    console.error('Move to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move item to cart',
      error: error.message
    });
  }
};

/**
 * @desc    Check if product is in wishlist
 * @route   GET /api/wishlist/check/:productId
 * @access  Private
 */
const checkProductInWishlist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: {
          inWishlist: false
        }
      });
    }

    const normalized = typeof productId === 'string' ? productId.trim() : '';
    const normalizedLower = normalized.toLowerCase();

    let item = null;

    if (mongoose.Types.ObjectId.isValid(normalized)) {
      item = wishlist.items.find((wishlistItem) =>
        wishlistItem.productId?.toString() === normalized
      );
    }

    if (!item) {
      item = wishlist.items.find((wishlistItem) =>
        wishlistItem.productSlug?.toLowerCase?.() === normalizedLower
      );
    }

    if (!item) {
      const product = await normalizeProductIdentifier(normalized);
      if (product) {
        const productIdString = product._id.toString();
        item = wishlist.items.find((wishlistItem) =>
          wishlistItem.productId?.toString() === productIdString
        );
      }
    }

    res.status(200).json({
      success: true,
      data: {
        inWishlist: Boolean(item),
        itemId: item?._id?.toString?.() || null
      }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: error.message
    });
  }
};

/**
 * @desc    Get wishlist summary (for header badge)
 * @route   GET /api/wishlist/summary
 * @access  Private
 */
const getWishlistSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get wishlist
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(200).json({
        success: true,
        data: {
          itemCount: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        itemCount: wishlist.itemCount
      }
    });
  } catch (error) {
    console.error('Get wishlist summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist summary',
      error: error.message
    });
  }
};

/**
 * @desc    Sync wishlist stock and prices
 * @route   POST /api/wishlist/sync
 * @access  Private
 */
const syncWishlist = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find wishlist
    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    // Update stock and prices
    await wishlist.updateItemStock();
    await wishlist.save();

    res.status(200).json({
      success: true,
      message: 'Wishlist synced successfully',
      data: {
        wishlist: formatWishlistResponse(wishlist)
      }
    });
  } catch (error) {
    console.error('Sync wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync wishlist',
      error: error.message
    });
  }
};

module.exports = {
  getWishlist,
  addWishlistItem,
  updateWishlistItem,
  removeWishlistItem,
  clearWishlist,
  moveToCart,
  checkProductInWishlist,
  getWishlistSummary,
  syncWishlist
};
