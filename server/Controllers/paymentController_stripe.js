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
 * @desc    Create Stripe Payment Intent (Step 1) - SECURE AMOUNT LOCKING
 * @route   POST /api/payments/create-order
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddressId, couponCode, customerNotes } = req.body;

    console.log('🔐 Creating secure Stripe payment intent for user:', userId);

    // 1. Validate shipping address
    if (!shippingAddressId) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const shippingAddress = await Address.findOne({ 
      _id: shippingAddressId, 
      userId 
    });

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: "Shipping address not found",
      });
    }

    // 2. Get and validate cart
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    console.log('🛒 Cart found with items:', cart.items.length);

    // 3. Validate cart items and check stock (REAL-TIME VALIDATION)
    const validatedItems = [];
    for (const item of cart.items) {
      const product = item.productId;
      
      if (!product) {
        console.log('❌ Product not found for item:', item._id);
        continue;
      }

      if (!product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product "${product.title}" is no longer available`,
        });
      }

      // Find the specific size/variant
      const sizeOption = product.sizeOptions.find(size => 
        size.size === item.size && size.isAvailable
      );

      if (!sizeOption) {
        return res.status(400).json({
          success: false,
          message: `Size "${item.size}" for "${product.title}" is not available`,
        });
      }

      if (sizeOption.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${sizeOption.stock} items available for "${product.title}" in size "${item.size}"`,
        });
      }

      // Calculate item pricing
      const unitPrice = sizeOption.price;
      const subtotal = unitPrice * item.quantity;

      validatedItems.push({
        productId: product._id,
        title: product.title,
        size: item.size,
        quantity: item.quantity,
        unitPrice: unitPrice,
        subtotal: subtotal,
        images: product.images,
        stock: sizeOption.stock
      });

      console.log(`✅ Validated: ${product.title} (${item.size}) x${item.quantity} = ₹${subtotal}`);
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid items found in cart",
      });
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
          message: "Invalid or expired coupon code",
        });
      }

      appliedCoupon = coupon;
      console.log('🎫 Coupon applied:', coupon.code);
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
        message: "Invalid order total",
      });
    }

    // 6. Create Stripe Payment Intent with locked amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.total * 100, // Stripe uses cents
      currency: 'inr', // Indian Rupees
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId.toString(),
        shippingAddressId: shippingAddressId.toString(),
        couponCode: couponCode || '',
        itemCount: validatedItems.length.toString(),
        secureTotal: pricing.total.toString(),
        customerNotes: customerNotes || ''
      },
      description: `Order for ${validatedItems.length} items - CiyaTake`,
      receipt_email: req.user.email,
      shipping: {
        name: shippingAddress.recipient,
        phone: shippingAddress.phone,
        address: {
          line1: shippingAddress.addressLine1,
          line2: shippingAddress.addressLine2 || '',
          city: shippingAddress.city,
          state: shippingAddress.state,
          postal_code: shippingAddress.postalCode,
          country: shippingAddress.country || 'IN',
        },
      },
    });

    console.log('✅ Stripe Payment Intent created:', paymentIntent.id, 'Amount locked:', pricing.total);

    // 7. Store order details securely for verification (Use Redis in production)
    global.pendingOrders = global.pendingOrders || {};
    global.pendingOrders[paymentIntent.id] = {
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
      message: 'Payment intent created successfully',
      data: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: pricing.total,
        currency: 'inr',
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
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
    console.error('❌ Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

/**
 * @desc    Verify Stripe payment and create order (Step 2) - SECURE VERIFICATION
 * @route   POST /api/payments/verify-payment
 * @access  Private
 */
const verifyPaymentAndCreateOrder = async (req, res) => {
  let paymentIntentId;
  try {
    const userId = req.user._id;
    const {
      paymentIntentId: intentId,
      customerNotes
    } = req.body;
    
    paymentIntentId = intentId;

    console.log('🔐 Verifying Stripe payment for intent:', paymentIntentId);
    console.log('📋 Payment verification details:', {
      paymentIntentId,
      user_id: userId
    });

    // 1. Retrieve and verify payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed successfully',
      });
    }

    console.log('🔐 Payment verification:', {
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

    // 2. Get stored order details with fallback
    console.log('📦 Checking pending orders:', Object.keys(global.pendingOrders || {}));
    let pendingOrder = global.pendingOrders?.[paymentIntentId];
    
    if (!pendingOrder) {
      // Fallback: try to reconstruct from payment intent metadata
      console.log('⚠️ No pending order found, reconstructing from metadata...');
      
      const metadata = paymentIntent.metadata;
      if (!metadata.userId || !metadata.shippingAddressId) {
        return res.status(400).json({
          success: false,
          message: 'Order details not found. Please contact support.',
        });
      }

      // Get cart and address from database
      const cart = await Cart.findOne({ userId: metadata.userId }).populate('items.productId');
      const shippingAddress = await Address.findById(metadata.shippingAddressId);
      
      if (!cart || !shippingAddress) {
        return res.status(400).json({
          success: false,
          message: 'Unable to verify order details. Please contact support.',
        });
      }

      // Reconstruct validated items (simplified version)
      const validatedItems = cart.items.map(item => ({
        productId: item.productId._id,
        title: item.productId.title,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.productId.sizeOptions.find(s => s.size === item.size)?.price || 0,
        subtotal: (item.productId.sizeOptions.find(s => s.size === item.size)?.price || 0) * item.quantity,
        images: item.productId.images
      }));

      pendingOrder = {
        userId: metadata.userId,
        items: validatedItems,
        pricing: {
          subtotal: paymentIntent.amount / 100,
          shipping: 0,
          tax: 0,
          discount: 0,
          total: paymentIntent.amount / 100
        },
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
        appliedCoupon: null,
        customerNotes: metadata.customerNotes,
        createdAt: new Date(paymentIntent.created * 1000)
      };
    }

    // 3. Verify user authorization
    if (pendingOrder.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access this order',
      });
    }

    // 4. Verify amount matches (SECURITY - AMOUNT LOCK VERIFICATION)
    const expectedAmount = Math.round(pendingOrder.pricing.total * 100); // in cents
    if (paymentIntent.amount !== expectedAmount) {
      console.error('❌ Amount mismatch:', { expected: expectedAmount, received: paymentIntent.amount });
      return res.status(400).json({
        success: false,
        message: 'Payment amount verification failed',
      });
    }

    // 5. Final stock check before creating order
    for (const item of pendingOrder.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product "${item.title}" is no longer available`,
        });
      }

      const sizeOption = product.sizeOptions.find(size => size.size === item.size);
      if (!sizeOption || sizeOption.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.title}" in size "${item.size}"`,
        });
      }
    }

    // 6. Generate unique order number with retry logic
    let orderNumber;
    let attempts = 0;
    while (attempts < 5) {
      try {
        orderNumber = `CYA${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
        break;
      } catch (error) {
        attempts++;
        if (attempts >= 5) {
          throw new Error('Unable to generate order number');
        }
      }
    }

    // 7. Create the order in database with retry logic for duplicates
    let order;
    attempts = 0;
    while (attempts < 3) {
      try {
        order = await Order.create({
          orderNumber,
          userId: pendingOrder.userId,
          items: pendingOrder.items.map(item => ({
            productId: item.productId,
            title: item.title,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.subtotal,
            images: item.images
          })),
          pricing: {
            subtotal: pendingOrder.pricing.subtotal,
            shipping: pendingOrder.pricing.shipping,
            tax: pendingOrder.pricing.tax,
            discount: pendingOrder.pricing.discount,
            grandTotal: pendingOrder.pricing.total
          },
          shippingAddress: pendingOrder.shippingAddress,
          payment: {
            method: 'stripe',
            status: 'completed',
            transactionId: paymentIntent.id,
            paidAt: new Date(),
            amount: pendingOrder.pricing.total,
            currency: 'INR'
          },
          appliedCoupon: pendingOrder.appliedCoupon,
          customerNotes: pendingOrder.customerNotes,
          status: 'confirmed',
          placedAt: new Date()
        });
        break;
      } catch (createError) {
        attempts++;
        if (createError.code === 11000 && attempts < 3) {
          // Duplicate order number, generate new one
          orderNumber = `CYA${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
          continue;
        }
        throw createError;
      }
    }

    // 8. Update stock levels
    for (const item of pendingOrder.items) {
      await Product.findOneAndUpdate(
        { _id: item.productId, 'sizeOptions.size': item.size },
        { $inc: { 'sizeOptions.$.stock': -item.quantity } }
      );
    }

    // 9. Update coupon usage if applicable
    if (pendingOrder.appliedCoupon) {
      await Coupon.findByIdAndUpdate(pendingOrder.appliedCoupon.couponId, {
        $inc: { usedCount: 1 }
      });
    }

    // 10. Clear user's cart (remove only ordered items, preserve saved-for-later)
    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    // 11. Clean up pending order
    delete global.pendingOrders[paymentIntentId];

    // 12. Create payment method entry in database
    try {
      const paymentMethod = paymentIntent.payment_method;
      if (paymentMethod) {
        const pmDetails = await stripe.paymentMethods.retrieve(paymentMethod);
        
        await PaymentMethod.create({
          userId: userId,
          type: pmDetails.type,
          brand: pmDetails.card?.brand || pmDetails.type,
          last4: pmDetails.card?.last4,
          expiry: pmDetails.card ? `${pmDetails.card.exp_month.toString().padStart(2, '0')}/${pmDetails.card.exp_year.toString().slice(-2)}` : null,
          paymentToken: paymentMethod,
          isDefault: false,
          isActive: true,
          nickname: `${pmDetails.card?.brand || pmDetails.type} ending in ${pmDetails.card?.last4 || '****'}`
        });
      }
    } catch (paymentMethodError) {
      console.error('❌ Save payment method error:', paymentMethodError);
      // Don't fail the order creation if payment method saving fails
    }

    console.log('✅ Order created successfully:', orderNumber);

    // 13. Send success response with complete order details
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
    if (paymentIntentId && global.pendingOrders?.[paymentIntentId]) {
      delete global.pendingOrders[paymentIntentId];
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
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    
    res.status(200).json({
      success: true,
      data: {
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        createdAt: new Date(paymentIntent.created * 1000),
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
    const { paymentIntentId, error_description } = req.body;
    
    console.log('❌ Payment failure reported:', {
      paymentIntentId,
      error: error_description
    });

    // Clean up pending order if exists
    if (paymentIntentId && global.pendingOrders?.[paymentIntentId]) {
      delete global.pendingOrders[paymentIntentId];
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
    const { paymentIntentId, amount, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required',
      });
    }

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? amount * 100 : undefined, // Amount in cents
      metadata: {
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
 * @desc    Webhook handler for Stripe events
 * @route   POST /api/payments/webhook
 * @access  Public (Webhook)
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    const body = req.body;

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: 'Webhook signature verification failed'
      });
    }

    console.log('📡 Stripe Webhook received:', event.type);

    // Handle different webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Payment succeeded:', event.data.object.id);
        // Additional logic can be added here
        break;
      case 'payment_intent.payment_failed':
        console.log('❌ Payment failed:', event.data.object.id);
        // Additional logic can be added here
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
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