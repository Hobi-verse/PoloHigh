const mongoose = require('mongoose');
const Cart = require('../models/Cart');
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

  const numeric = candidateValues.find((value) =>
    Number.isFinite(Number(value))
  );

  return Number(numeric ?? 0);
};

const formatCartItem = (item) => {
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

  const itemId = item._id?.toString?.() || item.id || productIdentifier || item.variantSku;

  return {
    id: itemId,
    productId: productIdentifier,
    title: item.title,
    price: item.price,
    size: item.size,
    color: item.color,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    savedForLater: item.savedForLater,
    addedAt: item.addedAt,
    variantSku: item.variantSku
  };
};

const formatCartResponse = (cart) => {
  if (!cart) {
    return {
      id: null,
      items: [],
      totals: {
        subtotal: 0,
        itemCount: 0,
        savedItemCount: 0
      },
      lastActivityAt: null
    };
  }

  const totals = {
    subtotal: Number.isFinite(Number(cart.totals?.subtotal)) ? Number(cart.totals.subtotal) : 0,
    itemCount: Number.isFinite(Number(cart.totals?.itemCount)) ? Number(cart.totals.itemCount) : 0,
    savedItemCount: Number.isFinite(Number(cart.totals?.savedItemCount)) ? Number(cart.totals.savedItemCount) : 0
  };

  return {
    id: cart._id?.toString?.() || cart.id || null,
    items: Array.isArray(cart.items)
      ? cart.items.map(formatCartItem).filter(Boolean)
      : [],
    totals,
    lastActivityAt: cart.lastActivityAt || null
  };
};

const resolveCartItemContext = async (cart, identifier) => {
  if (!cart || !identifier) {
    return { item: null, product: null };
  }

  const normalized = identifier.toString().trim();
  if (!normalized.length) {
    return { item: null, product: null };
  }

  const normalizedLower = normalized.toLowerCase();
  let item = null;

  if (mongoose.Types.ObjectId.isValid(normalized)) {
    item = cart.items.id(normalized);
  }

  if (!item && Array.isArray(cart.items)) {
    item = cart.items.find((cartItem) => {
      if (!cartItem) {
        return false;
      }

      const productIdString = typeof cartItem.productId === 'string'
        ? cartItem.productId
        : cartItem.productId?._id?.toString?.() || cartItem.productId?.toString?.();

      const variantSku = cartItem.variantSku?.toLowerCase?.();
      const productSlug = cartItem.productSlug?.toLowerCase?.();

      return (
        productIdString === normalized ||
        variantSku === normalizedLower ||
        productSlug === normalizedLower
      );
    });
  }

  let product = null;

  if (item) {
    product = await Product.findById(item.productId);
  } else {
    product = await normalizeProductIdentifier(normalized);

    if (product) {
      item = Array.isArray(cart.items)
        ? cart.items.find((cartItem) => {
          const productIdString = cartItem?.productId?._id?.toString?.()
            || cartItem?.productId?.toString?.()
            || (typeof cartItem?.productId === 'string' ? cartItem.productId : null);

          return productIdString === product._id.toString();
        })
        : null;
    }
  }

  return {
    item: item || null,
    product: product || null
  };
};

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get or create cart
    let cart = await Cart.findOne({ userId }).populate('items.productId', 'title slug price salePrice brand category media');

    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Update product snapshots with latest data
    const updatedItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (product) {
          const variant = product.variants.find((v) => v.sku === item.variantSku);
          if (variant) {
            // Update snapshot data
            item.price = resolveVariantPrice(product, variant);
            item.title = product.title;
            item.imageUrl = product.media.find((m) => m.isPrimary)?.url || product.media[0]?.url;
            item.size = variant.size;
            item.color = variant.color?.name || item.color;
            item.productSlug = product.slug;
          }
        }
        return item;
      })
    );

    cart.items = updatedItems;
    await cart.save();

    res.status(200).json({
      success: true,
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Private
 */
const addCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, variantSku, quantity = 1 } = req.body;

    // Validate input
    if (!productId || !variantSku) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and variant SKU are required'
      });
    }

    // Find product and variant
    const product = await normalizeProductIdentifier(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variant = product.variants.find(v => v.sku === variantSku);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }

    // Check stock availability
    if (variant.stockLevel < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${variant.stockLevel} items available in stock`
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = await Cart.create({ userId });
    }

    // Prepare item data
    const itemData = {
      productId: product._id,
      productSlug: product.slug,
      variantSku: variant.sku,
      title: product.title,
      price: resolveVariantPrice(product, variant),
      size: variant.size,
      color: variant.color?.name || variant.color,
      imageUrl: product.media.find((m) => m.isPrimary)?.url || product.media[0]?.url,
      quantity,
      savedForLater: false
    };

    // Add item using model method
    cart.addItem(itemData);
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Add cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PATCH /api/cart/items/:itemId
 * @access  Private
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;
    const { quantity } = req.body;

    // Validate quantity
    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Find item with flexible identifier support
    const { item, product } = await resolveCartItemContext(cart, itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    let productDoc = product;

    if (!productDoc && item.productId) {
      productDoc = await Product.findById(item.productId);
    }

    if (!productDoc && item.variantSku) {
      productDoc = await Product.findOne({ 'variants.sku': item.variantSku });
    }

    if (productDoc) {
      const variant = productDoc.variants.find((v) => v.sku === item.variantSku);

      if (variant) {
        if (variant.stockLevel < quantity) {
          return res.status(400).json({
            success: false,
            message: `Only ${variant.stockLevel} items available in stock`
          });
        }

        item.price = resolveVariantPrice(productDoc, variant);
        item.size = variant.size;
        item.color = variant.color?.name || item.color;
        item.productSlug = productDoc.slug || item.productSlug;
      }
    }

    // Update quantity using canonical identifier
    cart.updateItemQuantity(item._id, quantity);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:itemId
 * @access  Private
 */
const removeCartItem = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const { item } = await resolveCartItemContext(cart, itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Remove item
    cart.removeItem(item._id);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

/**
 * @desc    Save item for later
 * @route   PATCH /api/cart/items/:itemId/save-for-later
 * @access  Private
 */
const saveItemForLater = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const { item } = await resolveCartItemContext(cart, itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Save for later
    cart.saveItemForLater(item._id);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item saved for later',
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Save item for later error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save item for later',
      error: error.message
    });
  }
};

/**
 * @desc    Move item back to cart from saved for later
 * @route   PATCH /api/cart/items/:itemId/move-to-cart
 * @access  Private
 */
const moveItemToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const { item, product } = await resolveCartItemContext(cart, itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    let productDoc = product;

    if (!productDoc && item.productId) {
      productDoc = await Product.findById(item.productId);
    }

    if (!productDoc && item.variantSku) {
      productDoc = await Product.findOne({ 'variants.sku': item.variantSku });
    }

    if (productDoc) {
      const variant = productDoc.variants.find((v) => v.sku === item.variantSku);

      if (variant) {
        if (variant.stockLevel < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Only ${variant.stockLevel} items available in stock`
          });
        }

        item.price = resolveVariantPrice(productDoc, variant);
        item.size = variant.size;
        item.color = variant.color?.name || item.color;
        item.productSlug = productDoc.slug || item.productSlug;
      }
    }

    cart.moveItemToCart(item._id);
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item moved back to cart',
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Move item to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move item back to cart',
      error: error.message
    });
  }
};

/**
 * @desc    Clear cart
 * @route   DELETE /api/cart
 * @access  Private
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.clearCart();
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: {
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

/**
 * @desc    Get cart summary (for header/badge display)
 * @route   GET /api/cart/summary
 * @access  Private
 */
const getCartSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          itemCount: 0,
          subtotal: 0,
          savedItemCount: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        itemCount: cart.totals.itemCount,
        subtotal: cart.totals.subtotal,
        savedItemCount: cart.totals.savedItemCount
      }
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart summary',
      error: error.message
    });
  }
};

/**
 * @desc    Validate cart items (check stock, prices)
 * @route   POST /api/cart/validate
 * @access  Private
 */
const validateCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const issues = [];
    const updatedItems = [];

    for (const item of cart.items) {
      let product = null;

      if (item.productId) {
        product = await Product.findById(item.productId);
      }

      if (!product && item.productSlug) {
        product = await Product.findOne({ slug: item.productSlug });
      }

      if (!product) {
        issues.push({
          itemId: item._id?.toString?.() || null,
          type: 'product_not_found',
          message: `"${item.title}" is no longer available.`
        });
        continue;
      }

      const variant = product.variants.find((v) => v.sku === item.variantSku);
      if (!variant) {
        issues.push({
          itemId: item._id?.toString?.() || null,
          type: 'variant_not_found',
          message: `Selected variant for "${item.title}" is no longer available.`
        });
        continue;
      }

      if (variant.stockLevel < item.quantity) {
        issues.push({
          itemId: item._id?.toString?.() || null,
          type: 'insufficient_stock',
          message: `Only ${variant.stockLevel} items available in stock`,
          availableQuantity: variant.stockLevel,
          requestedQuantity: item.quantity
        });
      }

      const latestPrice = resolveVariantPrice(product, variant);
      if (latestPrice !== item.price) {
        issues.push({
          itemId: item._id?.toString?.() || null,
          type: 'price_changed',
          message: `Price for "${item.title}" has changed`,
          oldPrice: item.price,
          newPrice: latestPrice
        });

        item.price = latestPrice;
        item.size = variant.size;
        item.color = variant.color?.name || item.color;
        item.productSlug = product.slug || item.productSlug;
        updatedItems.push(item._id?.toString?.() || null);
      }
    }

    if (updatedItems.length > 0) {
      cart.calculateTotals();
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: {
        valid: issues.length === 0,
        issues,
        updatedItems,
        cart: formatCartResponse(cart)
      }
    });
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate cart',
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  saveItemForLater,
  moveItemToCart,
  clearCart,
  getCartSummary,
  validateCart
};
