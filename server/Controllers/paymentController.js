const razorpay = require("../config/razorpay");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const User = require("../models/User");
const PaymentMethod = require("../models/PaymentMethod");
const crypto = require("crypto");

// Create Razorpay order
const createOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", notes = {} } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    // Create order in Razorpay
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      notes: {
        userId,
        ...notes,
      },
      receipt: `order_${Date.now()}_${userId}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// Verify payment and create order
const verifyPaymentAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddressId,
      paymentMethodId,
      couponCode,
      customerNotes,
    } = req.body;

    const userId = req.user.id;

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    
    if (payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: "Payment not captured",
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get shipping address
    const Address = require("../models/Address");
    const shippingAddress = await Address.findById(shippingAddressId);
    if (!shippingAddress || shippingAddress.userId.toString() !== userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipping address",
      });
    }

    // Calculate totals
    const subtotal = cart.totals.subtotal;
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const tax = Math.round(subtotal * 0.18); // 18% GST
    let discount = 0;
    let couponData = null;

    // Apply coupon if provided
    if (couponCode) {
      const Coupon = require("../models/Coupon");
      const coupon = await Coupon.findOne({ code: couponCode, isActive: true });
      
      if (coupon && coupon.isValidForUser(userId) && coupon.isValidForAmount(subtotal)) {
        discount = coupon.calculateDiscount(subtotal);
        couponData = {
          couponId: coupon._id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountApplied: discount,
        };
      }
    }

    const grandTotal = subtotal + shipping + tax - discount;

    // Verify payment amount matches calculated total
    if (payment.amount !== grandTotal * 100) {
      return res.status(400).json({
        success: false,
        message: "Payment amount mismatch",
      });
    }

    // Generate unique order number
    const orderNumber = await Order.generateOrderNumber();

    // Prepare order items
    const orderItems = cart.items
      .filter((item) => !item.savedForLater)
      .map((item) => ({
        productId: item.productId._id,
        variantSku: item.variantSku,
        title: item.title,
        size: item.size,
        color: item.color,
        unitPrice: item.price,
        quantity: item.quantity,
        imageUrl: item.imageUrl,
        subtotal: item.price * item.quantity,
      }));

    // Create order
    const newOrder = new Order({
      orderNumber,
      userId,
      items: orderItems,
      status: "confirmed",
      payment: {
        method: payment.method,
        transactionId: razorpay_payment_id,
        status: "completed",
        paidAt: new Date(),
        paymentMethodId: paymentMethodId || null,
      },
      pricing: {
        subtotal,
        shipping,
        tax,
        discount,
        grandTotal,
      },
      coupon: couponData,
      shipping: {
        recipient: shippingAddress.name,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        instructions: shippingAddress.instructions,
        addressId: shippingAddress._id,
      },
      delivery: {
        estimatedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        deliveryWindow: "9 AM - 9 PM",
      },
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      notes: {
        customerNotes: customerNotes || "",
      },
      timeline: [
        {
          title: "Order received",
          description: "We've received your order and are processing it.",
          status: "complete",
          timestamp: new Date(),
        },
        {
          title: "Payment confirmed",
          description: "Payment received and order confirmed.",
          status: "complete",
          timestamp: new Date(),
        },
      ],
    });

    await newOrder.save();

    // Clear the cart
    cart.clearCart();
    await cart.save();

    // Update coupon usage if applied
    if (couponData) {
      const Coupon = require("../models/Coupon");
      await Coupon.findByIdAndUpdate(couponData.couponId, {
        $inc: { usedCount: 1 },
        $push: { usedBy: userId },
      });
    }

    // Store payment method if new
    if (payment.method === "card" && !paymentMethodId) {
      try {
        const newPaymentMethod = new PaymentMethod({
          userId,
          type: "card",
          brand: payment.card?.network || "Unknown",
          last4: payment.card?.last4 || "****",
          paymentToken: razorpay_payment_id,
          isDefault: false,
        });
        await newPaymentMethod.save();
      } catch (error) {
        console.error("Error saving payment method:", error);
        // Don't fail the order creation if payment method saving fails
      }
    }

    res.status(200).json({
      success: true,
      message: "Order created successfully",
      data: {
        order: newOrder,
        orderNumber: newOrder.orderNumber,
        orderId: newOrder._id,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

// Get payment status
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await razorpay.payments.fetch(paymentId);

    res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        method: payment.method,
        amount: payment.amount / 100,
        currency: payment.currency,
        createdAt: new Date(payment.created_at * 1000),
      },
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
      error: error.message,
    });
  }
};

// Handle payment failure
const handlePaymentFailure = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, error_description } = req.body;

    // Log payment failure
    console.error("Payment failed:", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      error: error_description,
      userId: req.user.id,
    });

    // You can store failed payment attempts in database for analytics
    // const FailedPayment = require("../models/FailedPayment");
    // await FailedPayment.create({
    //   userId: req.user.id,
    //   razorpayOrderId: razorpay_order_id,
    //   razorpayPaymentId: razorpay_payment_id,
    //   errorDescription: error_description,
    // });

    res.status(200).json({
      success: true,
      message: "Payment failure recorded",
    });
  } catch (error) {
    console.error("Handle payment failure error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to handle payment failure",
      error: error.message,
    });
  }
};

// Refund payment
const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, notes } = req.body;

    // Fetch original payment
    const payment = await razorpay.payments.fetch(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Create refund
    const refundAmount = amount ? amount * 100 : payment.amount; // Full refund if amount not specified
    
    const refund = await razorpay.payments.refund(paymentId, {
      amount: refundAmount,
      notes: notes || {},
      receipt: `refund_${Date.now()}`,
    });

    // Update order status
    const order = await Order.findOne({ "payment.transactionId": paymentId });
    if (order) {
      order.status = "refunded";
      order.payment.status = "refunded";
      order.updateStatus("refunded", {
        description: `Refund of ₹${refundAmount / 100} processed successfully`,
      });
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: {
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process refund",
      error: error.message,
    });
  }
};

// Webhook handler for payment events
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const body = JSON.stringify(req.body);
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body;
    
    switch (event.event) {
      case "payment.captured":
        // Handle successful payment
        console.log("Payment captured:", event.payload.payment.entity);
        break;
        
      case "payment.failed":
        // Handle failed payment
        console.log("Payment failed:", event.payload.payment.entity);
        break;
        
      case "refund.processed":
        // Handle refund processed
        console.log("Refund processed:", event.payload.refund.entity);
        break;
        
      default:
        console.log("Unhandled webhook event:", event.event);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  verifyPaymentAndCreateOrder,
  getPaymentStatus,
  handlePaymentFailure,
  refundPayment,
  handleWebhook,
};