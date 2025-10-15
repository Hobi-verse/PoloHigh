const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Product = require("../models/Product");
const User = require("../models/User");

/**
 * @desc    Create new order from cart
 * @route   POST /api/orders
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      addressId,
      paymentMethod,
      paymentMethodId,
      customerNotes,
      useCartItems = true,
      items: providedItems, // For direct checkout (skip cart)
    } = req.body;

    // 1. Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 2. Get and validate shipping address
    const shippingAddress = await Address.findOne({
      _id: addressId,
      userId: userId,
    });

    if (!shippingAddress) {
      return res.status(404).json({
        success: false,
        message: "Shipping address not found",
      });
    }

    // 3. Get order items
    let orderItems = [];
    let cart = null;

    if (useCartItems) {
      // Get items from cart
      cart = await Cart.findOne({ userId }).populate("items.productId");

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cart is empty. Cannot create order.",
        });
      }

      // Build order items from cart
      for (const cartItem of cart.items) {
        const product = cartItem.productId;

        // Verify product exists and is active
        if (!product || !product.isActive) {
          return res.status(400).json({
            success: false,
            message: `Product ${cartItem.productId} is no longer available`,
          });
        }

        // Find variant
        const variant = product.variants.find(
          (v) => v.sku === cartItem.variantSku
        );

        if (!variant) {
          return res.status(400).json({
            success: false,
            message: `Variant ${cartItem.variantSku} not found for product ${product.title}`,
          });
        }

        // Check stock
        if (variant.stock < cartItem.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.title} (${variant.size}/${variant.color}). Only ${variant.stock} available.`,
          });
        }

        // Calculate item pricing
        const unitPrice = variant.salePrice || variant.price;
        const subtotal = unitPrice * cartItem.quantity;

        orderItems.push({
          productId: product._id,
          variantSku: variant.sku,
          title: product.title,
          size: variant.size,
          color: variant.color,
          unitPrice: unitPrice,
          quantity: cartItem.quantity,
          imageUrl: product.media && product.media[0] ? product.media[0].url : "",
          discount: 0, // TODO: Apply product-level discounts
          subtotal: subtotal,
        });
      }
    } else {
      // Direct checkout with provided items
      if (!providedItems || providedItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No items provided for order",
        });
      }

      // TODO: Validate and build order items from providedItems
      // Similar validation as cart items
      return res.status(501).json({
        success: false,
        message: "Direct checkout not yet implemented",
      });
    }

    // 4. Calculate order pricing
    const subtotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const shipping = subtotal >= 5000 ? 0 : 150; // Free shipping above ₹5000
    const taxRate = 0.06; // 6% tax
    const tax = Math.round(subtotal * taxRate);
    const discount = 0; // TODO: Apply coupon discounts
    const grandTotal = subtotal + shipping + tax - discount;

    // 5. Generate unique order number
    const orderNumber = await Order.generateOrderNumber();

    // 6. Create order
    const order = new Order({
      orderNumber,
      userId,
      items: orderItems,
      status: "pending",
      payment: {
        method: paymentMethod,
        paymentMethodId: paymentMethodId || null,
        status: "pending",
      },
      pricing: {
        subtotal,
        shipping,
        tax,
        discount,
        grandTotal,
      },
      shipping: {
        recipient: shippingAddress.recipient,
        phone: shippingAddress.phone,
        addressLine1: shippingAddress.addressLine1,
        addressLine2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postalCode: shippingAddress.postalCode,
        country: shippingAddress.country,
        instructions: shippingAddress.deliveryInstructions || customerNotes || "",
        addressId: shippingAddress._id,
      },
      delivery: {
        estimatedDeliveryDate: this.calculateEstimatedDelivery(),
        deliveryWindow: this.getDeliveryWindow(),
      },
      timeline: [
        {
          title: "Order received",
          description: "We've received your order and are processing it.",
          status: "complete",
        },
        {
          title: "Payment processing",
          description: "Your payment is being verified.",
          status: "current",
        },
        {
          title: "Preparing items",
          description: "We'll start packing your items once payment is confirmed.",
          status: "upcoming",
        },
      ],
      customer: {
        name: user.name,
        email: user.email,
        phone: user.phone || shippingAddress.phone,
      },
      notes: {
        customerNotes: customerNotes || "",
      },
    });

    await order.save();

    // 7. Reduce product stock
    for (const item of orderItems) {
      await Product.updateOne(
        { _id: item.productId, "variants.sku": item.variantSku },
        {
          $inc: {
            "variants.$.stock": -item.quantity,
            totalSold: item.quantity,
          },
        }
      );
    }

    // 8. Clear cart (if used)
    if (cart) {
      cart.items = [];
      cart.savedForLater = [];
      await cart.save();
    }

    // 9. Populate order for response
    await order.populate("items.productId", "title slug category");

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          placedAt: order.placedAt,
          deliveryWindow: order.delivery.deliveryWindow,
          items: order.items,
          pricing: order.pricing,
          shipping: order.shipping,
          payment: {
            method: order.payment.method,
            status: order.payment.status,
          },
          timeline: order.timeline,
        },
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

// Helper method to calculate estimated delivery
function calculateEstimatedDelivery() {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 4); // 4 days from now
  return deliveryDate;
}

// Helper method to get delivery window
function getDeliveryWindow() {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 3);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 5);

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * @desc    Get all orders for user
 * @route   GET /api/orders
 * @access  Private
 */
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = "placedAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get orders
    const orders = await Order.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("items.productId", "title slug category media")
      .lean();

    // Get total count
    const totalOrders = await Order.countDocuments(filter);

    // Format orders for response
    const formattedOrders = orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      deliveryWindow: order.delivery.deliveryWindow,
      estimatedDeliveryDate: order.delivery.estimatedDeliveryDate,
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        id: item._id,
        productId: item.productId?._id,
        title: item.title,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        imageUrl: item.imageUrl,
      })),
      pricing: {
        subtotal: order.pricing.subtotal,
        shipping: order.pricing.shipping,
        tax: order.pricing.tax,
        discount: order.pricing.discount,
        grandTotal: order.pricing.grandTotal,
      },
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        transactionId: order.payment.transactionId,
      },
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          hasMore: skip + formattedOrders.length < totalOrders,
        },
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId })
      .populate("items.productId", "title slug category media")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Format order for response
    const formattedOrder = {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      items: order.items.map((item) => ({
        id: item._id,
        productId: item.productId?._id,
        title: item.title,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        imageUrl: item.imageUrl,
        discount: item.discount,
      })),
      pricing: order.pricing,
      shipping: order.shipping,
      delivery: order.delivery,
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        transactionId: order.payment.transactionId,
        paidAt: order.payment.paidAt,
      },
      timeline: order.timeline,
      customer: order.customer,
      support: order.support,
      notes: order.notes,
    };

    res.json({
      success: true,
      data: {
        order: formattedOrder,
      },
    });
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id/status
 * @access  Private (Admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courierService } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["packed", "cancelled"],
      packed: ["shipped", "cancelled"],
      shipped: ["out-for-delivery"],
      "out-for-delivery": ["delivered"],
      delivered: [],
      cancelled: ["refunded"],
      refunded: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}`,
      });
    }

    // Update status using model method
    order.updateStatus(status);

    // Add tracking info if provided
    if (trackingNumber) {
      order.delivery.trackingNumber = trackingNumber;
    }
    if (courierService) {
      order.delivery.courierService = courierService;
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          timeline: order.timeline,
          delivery: order.delivery,
        },
      },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};

/**
 * @desc    Cancel order
 * @route   PATCH /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ["pending", "confirmed", "processing"];
    if (!cancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${order.status}`,
      });
    }

    // Update status
    order.updateStatus("cancelled", {
      description: reason || "Order cancelled by customer",
    });

    // Restore product stock
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "variants.sku": item.variantSku },
        {
          $inc: {
            "variants.$.stock": item.quantity,
            totalSold: -item.quantity,
          },
        }
      );
    }

    // Add cancellation reason to notes
    if (reason) {
      order.notes.customerNotes = order.notes.customerNotes
        ? `${order.notes.customerNotes}\n\nCancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          cancelledAt: order.cancelledAt,
        },
      },
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: error.message,
    });
  }
};

/**
 * @desc    Get order statistics
 * @route   GET /api/orders/stats
 * @access  Private
 */
exports.getOrderStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get total orders
    const totalOrders = await Order.countDocuments({ userId });

    // Get orders by status
    const statusCounts = await Order.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Get total spent
    const totalSpent = await Order.aggregate([
      { $match: { userId: userId, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$pricing.grandTotal" } } },
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ userId })
      .sort({ placedAt: -1 })
      .limit(5)
      .select("orderNumber status placedAt pricing.grandTotal")
      .lean();

    res.json({
      success: true,
      data: {
        totalOrders,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        totalSpent: totalSpent[0]?.total || 0,
        recentOrders: recentOrders.map((order) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          placedAt: order.placedAt,
          total: order.pricing.grandTotal,
        })),
      },
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders/admin/all
 * @access  Private (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = "placedAt",
      sortOrder = "desc",
      search,
    } = req.query;

    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { orderNumber: new RegExp(search, "i") },
        { "customer.email": new RegExp(search, "i") },
        { "customer.name": new RegExp(search, "i") },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get orders
    const orders = await Order.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email")
      .lean();

    // Get total count
    const totalOrders = await Order.countDocuments(filter);

    // Format orders for response
    const formattedOrders = orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      customer: order.customer,
      itemCount: order.items.length,
      pricing: order.pricing,
      payment: {
        method: order.payment.method,
        status: order.payment.status,
      },
    }));

    res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / parseInt(limit)),
          totalOrders,
          hasMore: skip + formattedOrders.length < totalOrders,
        },
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

/**
 * @desc    Confirm payment (Admin/Webhook)
 * @route   PATCH /api/orders/:id/confirm-payment
 * @access  Private (Admin)
 */
exports.confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.payment.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Payment already confirmed",
      });
    }

    // Update payment status
    order.payment.status = "completed";
    order.payment.paidAt = new Date();
    if (transactionId) {
      order.payment.transactionId = transactionId;
    }

    // Update order status to confirmed
    order.updateStatus("confirmed");

    await order.save();

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          payment: order.payment,
        },
      },
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to confirm payment",
      error: error.message,
    });
  }
};
