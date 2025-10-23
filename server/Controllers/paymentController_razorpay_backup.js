// const Razorpay = require("razorpay"); // Commented out for Stripe implementation
// const crypto = require("crypto"); // Commented out for Stripe implementation
const stripe = require("../config/stripe");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const PaymentMethod = require("../models/PaymentMethod");

// Initialize Razorpay with environment variables (COMMENTED OUT)
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// Constants for calculations
const SHIPPING_THRESHOLD = 500;
const SHIPPING_FEE = 50;
// Removed TAX_RATE as tax is no longer applied

/**
 * Calculate pricing securely on server-side (LOCKED AMOUNT LIKE AMAZON)
 */
const calculateSecurePricing = (cartItems, appliedCoupon = null) => {
  console.log('🔢 Starting price calculation with items:', cartItems.length);
  
  const subtotal = cartItems.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    console.log(`  📦 ${item.title}: ₹${item.unitPrice} × ${item.quantity} = ₹${itemTotal}`);
    return sum + itemTotal;
  }, 0);

  console.log('💸 Subtotal calculated:', subtotal);

  const shipping = 0; // Removed shipping cost - always free
  // Removed tax calculation
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
    } else if (appliedCoupon.discountType === 'fixed') {
      discount = Math.min(appliedCoupon.discountValue, subtotal);
    }
    
    if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
      discount = appliedCoupon.maxDiscount;
    }
  }

  const total = subtotal - discount; // Only product price minus discount

  const finalPricing = {
    subtotal: Math.round(subtotal),
    shipping: 0, // Always free shipping
    tax: 0, // No tax
    discount: Math.round(discount),
    total: Math.round(total)
  };
  
  console.log('🎯 Final pricing:', finalPricing);
  return finalPricing;
};

/**
 * @desc    Create Razorpay order (Step 1) - SECURE AMOUNT LOCKING
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddressId, couponCode, customerNotes } = req.body;

    console.log('🔐 Creating secure payment order for user:', userId);

    // 1. Validate shipping address
    if (!shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: 'Shipping address is required'
      });
    }

    const shippingAddress = await Address.findOne({ 
      _id: shippingAddressId, 
      userId 
    });

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping address'
      });
    }

    // 2. Get and validate cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty'
      });
    }

    console.log('🛒 Cart found with items:', cart.items.length);

    // 3. Validate cart items and check stock (REAL-TIME VALIDATION)
    const validatedItems = [];
    for (const item of cart.items) {
      console.log('📦 Processing cart item:', {
        productId: item.productId?._id || item.productId,
        variantSku: item.variantSku,
        sku: item.sku,
        quantity: item.quantity,
        title: item.title,
        savedForLater: item.savedForLater
      });

      if (item.savedForLater) {
        console.log('⏭️ Skipping saved for later item');
        continue;
      }

      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        console.log('❌ Product not found or inactive:', item.productId);
        return res.status(400).json({
          success: false,
          message: `Product "${item.title}" is no longer available`
        });
      }

      console.log('🔍 Product found:', {
        id: product._id,
        title: product.title,
        variants: product.variants?.length || 0,
        price: product.price
      });

      // Find the specific variant by SKU (try both variantSku and sku fields)
      const variantSku = item.variantSku || item.sku;
      let variant = null;
      
      if (variantSku && product.variants?.length > 0) {
        variant = product.variants.find(v => v.sku === variantSku);
        console.log('🎯 Variant search by SKU:', variantSku, variant ? 'Found' : 'Not found');
        if (variant) {
          console.log('🔍 Variant details:', {
            sku: variant.sku,
            price: variant.price,
            salePrice: variant.salePrice,
            size: variant.size,
            color: variant.color,
            stock: variant.stock
          });
        }
      }

      // If no variant found and product has variants, use first variant
      if (!variant && product.variants?.length > 0) {
        variant = product.variants[0];
        console.log('🔄 Using first variant as fallback:', variant.sku);
        console.log('🔍 Fallback variant details:', {
          sku: variant.sku,
          price: variant.price,
          salePrice: variant.salePrice,
          size: variant.size,
          color: variant.color,
          stock: variant.stock
        });
      }

      // Get price from variant or product - check multiple price fields
      let unitPrice = 0;
      if (variant) {
        unitPrice = parseFloat(variant.price || variant.salePrice || variant.originalPrice || variant.basePrice || 0);
      } else {
        unitPrice = parseFloat(product.price || product.salePrice || product.originalPrice || product.basePrice || 0);
      }

      console.log('💰 Price determined:', unitPrice, 'from', variant ? 'variant' : 'product');

      // If still no price, check if there's a base price on the product
      if (!unitPrice || unitPrice <= 0) {
        console.log('⚠️ No price found, checking product base price...');
        console.log('📊 Product price fields:', {
          price: product.price,
          salePrice: product.salePrice,
          originalPrice: product.originalPrice,
          basePrice: product.basePrice
        });
        
        // Try to get price from any available field
        unitPrice = parseFloat(
          product.basePrice ||
          product.price || 
          product.salePrice || 
          product.originalPrice || 
          4000 // Final fallback
        );
        
        console.log('🎯 Using fallback price:', unitPrice);
      }

      if (!unitPrice || unitPrice <= 0) {
        console.log('❌ Invalid price for product:', product.title);
        return res.status(400).json({
          success: false,
          message: `Price not available for ${product.title}`
        });
      }

      // Check stock availability
      const availableStock = variant ? (variant.stock || 999) : (product.stock || 999); // Default to high stock if undefined
      console.log('📦 Stock check:', { availableStock, requested: item.quantity });
      
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}. Only ${availableStock} available.`
        });
      }

      const validatedItem = {
        productId: product._id,
        variantSku: variant?.sku || variantSku || `${product._id}_default`,
        title: product.title,
        unitPrice: unitPrice,
        quantity: item.quantity,
        size: variant?.size || item.size || 'Standard',
        color: typeof (variant?.color) === 'object' ? variant.color.name : (variant?.color || item.color || 'Default'),
        subtotal: unitPrice * item.quantity,
        imageUrl: product.images?.[0]?.url || '/default-image.jpg'
      };

      console.log('✅ Validated item:', validatedItem);
      validatedItems.push(validatedItem);
    }

    // 4. Validate and apply coupon if provided
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (!coupon) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired coupon code'
        });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'Coupon usage limit exceeded'
        });
      }

      appliedCoupon = coupon;
    }

    // 5. Calculate secure pricing on server-side (AMOUNT LOCKED)
    console.log('🧮 Calculating pricing for items:', validatedItems.length);
    console.log('💰 Items details:', validatedItems.map(item => ({
      title: item.title,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal
    })));
    
    const pricing = calculateSecurePricing(validatedItems, appliedCoupon);
    console.log('📊 Calculated pricing:', pricing);

    if (pricing.total <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order total amount'
      });
    }

    // 6. Create Razorpay order with locked amount
    const shortReceipt = `ord_${Date.now().toString().slice(-8)}`;
    const razorpayOrder = await razorpay.orders.create({
      amount: pricing.total * 100, // Convert to paise
      currency: 'INR',
      receipt: shortReceipt,
      payment_capture: 1,
      notes: {
        userId: userId.toString(),
        shippingAddressId: shippingAddressId.toString(),
        couponCode: couponCode || '',
        itemCount: validatedItems.length.toString(),
        secureTotal: pricing.total.toString(), // LOCKED AMOUNT
        customerNotes: customerNotes || ''
      }
    });

    console.log('✅ Razorpay order created:', razorpayOrder.id, 'Amount locked:', pricing.total);

    // 7. Store order details securely for verification (Use Redis in production)
    global.pendingOrders = global.pendingOrders || {};
    global.pendingOrders[razorpayOrder.id] = {
      userId,
      items: validatedItems,
      pricing,
      shippingAddress: {
        addressId: shippingAddress._id,
        recipient: shippingAddress.recipient,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        instructions: shippingAddress.deliveryInstructions
      },
      appliedCoupon: appliedCoupon ? {
        couponId: appliedCoupon._id,
        code: appliedCoupon.code,
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
        discountApplied: pricing.discount
      } : null,
      customerNotes,
      createdAt: new Date()
    };

    res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        orderId: razorpayOrder.id,
        amount: pricing.total,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        items: validatedItems.map(item => ({
          title: item.title,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal
        })),
        pricing: {
          subtotal: pricing.subtotal,
          shipping: pricing.shipping,
          tax: pricing.tax,
          discount: pricing.discount,
          total: pricing.total
        },
        shippingAddress: {
          recipient: shippingAddress.recipient,
          formattedAddress: shippingAddress.getFormattedAddress()
        }
      }
    });

  } catch (error) {
    console.error('❌ Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

/**
 * @desc    Verify payment and create order (Step 2) - SECURE VERIFICATION
 * @route   POST /api/payments/verify-payment
 * @access  Private
 */
const verifyPaymentAndCreateOrder = async (req, res) => {
  let razorpay_order_id;
  try {
    const userId = req.user._id;
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id,
      razorpay_signature,
      customerNotes
    } = req.body;
    
    razorpay_order_id = orderId;

    console.log('🔐 Verifying payment for order:', razorpay_order_id);
    console.log('📋 Payment verification details:', {
      razorpay_order_id,
      razorpay_payment_id,
      signature_length: razorpay_signature?.length,
      user_id: userId
    });

    // 1. Verify Razorpay signature (CRITICAL SECURITY)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    console.log('🔐 Signature verification:', {
      expected: expectedSignature,
      received: razorpay_signature,
      match: expectedSignature === razorpay_signature
    });

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

    // 2. Get stored order details with fallback
    console.log('📦 Checking pending orders:', Object.keys(global.pendingOrders || {}));
    let pendingOrder = global.pendingOrders?.[razorpay_order_id];
    
    if (!pendingOrder) {
      console.error('❌ Order details not found, attempting recovery...');
      
      try {
        // Fetch order details from Razorpay
        const razorpayOrderDetails = await razorpay.orders.fetch(razorpay_order_id);
        console.log('🔍 Razorpay order details:', {
          id: razorpayOrderDetails.id,
          amount: razorpayOrderDetails.amount,
          status: razorpayOrderDetails.status
        });
        
        // Reconstruct order from current cart
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.filter(item => !item.savedForLater).length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Cannot recover order - cart is empty. Please place order again.'
          });
        }
        
        // Calculate total from cart items
        let subtotal = 0;
        const orderItems = [];
        
        for (const cartItem of cart.items.filter(item => !item.savedForLater)) {
          const product = cartItem.productId;
          const variant = product.variants?.find(v => v.sku === cartItem.variantSku);
          
          let itemPrice = variant?.salePrice || variant?.price || product.salePrice || product.price || product.basePrice || 1;
          const itemSubtotal = itemPrice * cartItem.quantity;
          subtotal += itemSubtotal;
          
          orderItems.push({
            productId: product._id,
            variantSku: cartItem.variantSku || variant?.sku || `${product._id}-default`,
            title: cartItem.title || product.title,
            size: variant?.size || 'Standard',
            color: typeof (variant?.color) === 'object' ? variant.color.name : (variant?.color || 'Default'),
            unitPrice: itemPrice,
            quantity: cartItem.quantity,
            imageUrl: product.images?.[0]?.url || '/default-image.jpg'
          });
        }
        
        // Verify amount matches Razorpay order
        const expectedTotal = razorpayOrderDetails.amount / 100;
        if (Math.abs(subtotal - expectedTotal) > 0.01) {
          console.error('❌ Amount mismatch during recovery:', subtotal, 'vs', expectedTotal);
          return res.status(400).json({
            success: false,
            message: 'Order amount verification failed. Please place order again.'
          });
        }
        
        // Reconstruct pending order
        pendingOrder = {
          userId,
          items: orderItems,
          pricing: {
            subtotal: subtotal,
            shipping: 0,
            tax: 0,
            discount: 0,
            total: subtotal
          },
          shippingAddress: null,
          appliedCoupon: null
        };
        
        // Store for cleanup
        global.pendingOrders = global.pendingOrders || {};
        global.pendingOrders[razorpay_order_id] = pendingOrder;
        
        console.log('✅ Order recovered successfully');
        
      } catch (fetchError) {
        console.error('❌ Failed to recover order:', fetchError);
        return res.status(400).json({
          success: false,
          message: 'Order details not found or expired. Please try placing the order again.'
        });
      }
    }

    // 3. Verify user authorization
    if (pendingOrder.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized payment attempt'
      });
    }

    // 4. Verify payment status with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return res.status(400).json({
        success: false,
        message: `Payment not successful. Status: ${payment.status}`
      });
    }

    // 5. Verify amount matches (SECURITY - AMOUNT LOCK VERIFICATION)
    const expectedAmount = Math.round(pendingOrder.pricing.total * 100); // in paise
    if (payment.amount !== expectedAmount) {
      console.error('❌ Payment amount mismatch:', payment.amount, 'vs', expectedAmount);
      return res.status(400).json({
        success: false,
        message: 'Payment amount verification failed'
      });
    }

    // 6. Final stock check before creating order
    for (const item of pendingOrder.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.title}`
        });
      }
      
      const variant = product.variants?.find(v => v.sku === item.variantSku);
      const availableStock = variant?.stock || product.stock || 999;
      
      if (availableStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.title} - ${item.size}. Available: ${availableStock}, Requested: ${item.quantity}`
        });
      }
    }

    // 7. Generate unique order number with retry logic
    let orderNumber;
    let attempts = 0;
    while (attempts < 5) {
      try {
        orderNumber = await Order.generateOrderNumber();
        break;
      } catch (error) {
        attempts++;
        if (attempts >= 5) {
          throw new Error('Failed to generate unique order number after multiple attempts');
        }
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // 8. Create the order in database with retry logic for duplicates
    let order;
    attempts = 0;
    while (attempts < 3) {
      try {
        order = await Order.create({
          orderNumber,
          userId,
          items: pendingOrder.items,
          status: 'confirmed',
          payment: {
            method: 'Online Payment',
            transactionId: razorpay_payment_id,
            status: 'completed',
            paidAt: new Date()
          },
          pricing: {
            subtotal: pendingOrder.pricing.subtotal,
            shipping: pendingOrder.pricing.shipping || 0,
            tax: pendingOrder.pricing.tax || 0,
            discount: pendingOrder.pricing.discount || 0,
            grandTotal: pendingOrder.pricing.total
          },
          coupon: pendingOrder.appliedCoupon || null,
          shipping: pendingOrder.shippingAddress || {
            fullName: req.user.name || 'Customer',
            phone: req.user.phone || '0000000000',
            address: 'Default Address',
            city: 'Default City',
            state: 'Default State',
            pincode: '000000',
            country: 'India'
          },
          customer: {
            name: req.user.name || 'Customer',
            email: req.user.email,
            phone: req.user.phone || '0000000000'
          },
          notes: {
            customerNotes: customerNotes || ''
          },
          placedAt: new Date(),
          confirmedAt: new Date()
        });
        break; // Success, exit retry loop
      } catch (createError) {
        if (createError.code === 11000) {
          // Duplicate order number, generate new one and retry
          orderNumber = await Order.generateOrderNumber();
          attempts++;
          if (attempts >= 3) {
            throw new Error('Failed to create order due to duplicate order numbers');
          }
        } else {
          throw createError; // Different error, don't retry
        }
      }
    }

    // 9. Update stock levels
    for (const item of pendingOrder.items) {
      await Product.updateOne(
        { _id: item.productId, 'variants.sku': item.variantSku },
        { $inc: { 'variants.$.stock': -item.quantity } }
      );
    }

    // 10. Update coupon usage if applicable
    if (pendingOrder.appliedCoupon) {
      await Coupon.updateOne(
        { _id: pendingOrder.appliedCoupon.couponId },
        { $inc: { usedCount: 1 } }
      );
    }

    // 11. Clear user's cart (remove only ordered items, preserve saved-for-later)
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = cart.items.filter(item => item.savedForLater);
      await cart.save();
      console.log('🧹 Cart cleared after successful order');
    }

    // 12. Clean up pending order
    delete global.pendingOrders[razorpay_order_id];

    // 13. Create payment method entry in database
    try {
      const paymentMethodData = {
        userId: userId,
        type: payment.method === 'card' ? 'card' : payment.method === 'upi' ? 'upi' : 'card', // Default to card for online payments
        brand: payment.method === 'upi' ? 'UPI' : 'Online Payment',
        paymentToken: razorpay_payment_id,
        isDefault: false,
        isActive: true,
        nickname: `Payment for Order ${orderNumber}`
      };

      // For card payments, try to get card details if available
      if (payment.method === 'card' && payment.card) {
        paymentMethodData.brand = payment.card.network || 'Card';
        paymentMethodData.last4 = payment.card.last4 || '****';
        paymentMethodData.holderName = payment.card.name || req.user.name;
      }

      // For UPI payments
      if (payment.method === 'upi' && payment.upi) {
        paymentMethodData.upiHandle = payment.upi.vpa || 'upi@payment';
      }

      const savedPaymentMethod = await PaymentMethod.create(paymentMethodData);
      console.log('💳 Payment method saved:', savedPaymentMethod._id);
    } catch (paymentMethodError) {
      console.error('⚠️ Failed to save payment method:', paymentMethodError.message);
      // Don't fail the order creation for this error
    }

    console.log('✅ Order created successfully:', orderNumber);

    // 14. Send success response with complete order details
    return res.status(200).json({
      success: true,
      message: 'Payment verified and order created successfully',
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.pricing.grandTotal,
          items: order.items.map(item => ({
            title: item.title,
            size: item.size,
            quantity: item.quantity,
            price: item.unitPrice
          })),
          payment: {
            transactionId: order.payment.transactionId,
            method: order.payment.method,
            status: order.payment.status,
            paidAt: order.payment.paidAt
          },
          placedAt: order.placedAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    
    // Clean up pending order on error
    if (razorpay_order_id && global.pendingOrders?.[razorpay_order_id]) {
      delete global.pendingOrders[razorpay_order_id];
    }
    
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

/**
 * @desc    Get payment status
 * @route   GET /api/payments/status/:paymentId
 * @access  Private
 */
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount / 100,
        currency: payment.currency,
        method: payment.method,
        createdAt: new Date(payment.created_at * 1000),
      },
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message,
    });
  }
};

/**
 * @desc    Handle payment failure
 * @route   POST /api/payments/failure
 * @access  Private
 */
const reportPaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, error_description } = req.body;
    
    console.log('❌ Payment failure reported:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      error: error_description
    });

    // Clean up pending order if exists
    if (razorpay_order_id && global.pendingOrders?.[razorpay_order_id]) {
      delete global.pendingOrders[razorpay_order_id];
    }

    res.status(200).json({
      success: true,
      message: 'Payment failure reported',
    });
  } catch (error) {
    console.error('Report payment failure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report payment failure',
      error: error.message,
    });
  }
};

/**
 * @desc    Request refund (Admin only)
 * @route   POST /api/payments/refund
 * @access  Private (Admin)
 */
const requestRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
    }

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined,
      notes: {
        reason: reason || 'Customer request',
        refundedBy: req.user.email,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message,
    });
  }
};

/**
 * @desc    Webhook handler for Razorpay events
 * @route   POST /api/payments/webhook
 * @access  Public (Webhook)
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature',
      });
    }

    const event = req.body;
    console.log('📡 Webhook received:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('✅ Payment captured:', event.payload.payment.entity.id);
        break;
      case 'payment.failed':
        console.log('❌ Payment failed:', event.payload.payment.entity.id);
        break;
      case 'order.paid':
        console.log('💰 Order paid:', event.payload.order.entity.id);
        break;
      default:
        console.log('📋 Unhandled webhook event:', event.event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
    });
  }
};

module.exports = {
  createOrder,
  verifyPaymentAndCreateOrder,
  getPaymentStatus,
  reportPaymentFailure,
  requestRefund,
  handleWebhook,
};
