const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Address = require("../models/Address");
const Product = require("../models/Product");
const User = require("../models/User");

const buildOrderIdentifierQuery = (identifier) =>
  mongoose.Types.ObjectId.isValid(identifier)
    ? { _id: identifier }
    : { orderNumber: identifier };

const ACTIVE_RETURN_STATUSES = new Set([
  "requested",
  "approved",
  "in-transit",
  "received",
]);

const FINAL_RETURN_STATUSES = new Set([
  "completed",
  "cancelled",
  "rejected",
]);

const ALL_RETURN_STATUSES = new Set([
  ...ACTIVE_RETURN_STATUSES,
  ...FINAL_RETURN_STATUSES,
]);

const RETURN_STATUS_TRANSITIONS = {
  requested: ["approved", "rejected", "cancelled"],
  approved: ["in-transit", "cancelled"],
  "in-transit": ["received", "cancelled"],
  received: ["completed", "cancelled"],
  rejected: [],
  completed: [],
  cancelled: [],
};

const RETURN_TIMELINE_TITLES = {
  requested: "Return requested",
  approved: "Return approved",
  "in-transit": "Return in transit",
  received: "Return received",
  completed: "Return completed",
  cancelled: "Return cancelled",
  rejected: "Return rejected",
};

const RETURN_TIMELINE_DESCRIPTIONS = {
  requested: "Customer has requested a return for this order.",
  approved: "Return request approved by the support team.",
  "in-transit": "Returned items are in transit back to the warehouse.",
  received: "Returned items have been received and are under inspection.",
  completed: "Return process completed and resolution applied.",
  cancelled: "Return request cancelled.",
  rejected: "Return request rejected.",
};

const serializeReturnRequest = (returnRequest) => {
  if (!returnRequest || !returnRequest.status) {
    return null;
  }

  const items = Array.isArray(returnRequest.items)
    ? returnRequest.items.map((item) => ({
      itemId: item.itemId,
      productId: item.productId?._id ?? item.productId ?? null,
      variantSku: item.variantSku ?? null,
      title: item.title ?? null,
      quantity: item.quantity ?? null,
      unitPrice: item.unitPrice ?? null,
    }))
    : [];

  return {
    status: returnRequest.status,
    reason: returnRequest.reason ?? "",
    customerNotes: returnRequest.customerNotes ?? "",
    adminNotes: returnRequest.adminNotes ?? "",
    resolution: returnRequest.resolution ?? null,
    refundAmount:
      typeof returnRequest.refundAmount === "number"
        ? returnRequest.refundAmount
        : null,
    requestedAt: returnRequest.requestedAt ?? null,
    updatedAt: returnRequest.updatedAt ?? null,
    resolvedAt: returnRequest.resolvedAt ?? null,
    processedBy:
      returnRequest.processedBy?._id ?? returnRequest.processedBy ?? null,
    items,
    evidence: Array.isArray(returnRequest.evidence)
      ? returnRequest.evidence
      : [],
  };
};

const appendReturnTimelineEvent = (order, status, descriptionOverride) => {
  if (!order.timeline) {
    order.timeline = [];
  }

  const timelineArray = Array.isArray(order.timeline)
    ? order.timeline
    : [];

  timelineArray.forEach((event) => {
    if (event.status === "current") {
      event.status = "complete";
    }
  });

  timelineArray.push({
    title: RETURN_TIMELINE_TITLES[status] || `Return ${status}`,
    description:
      descriptionOverride || RETURN_TIMELINE_DESCRIPTIONS[status] || "",
    status: FINAL_RETURN_STATUSES.has(status) ? "complete" : "current",
    timestamp: new Date(),
  });

  order.timeline = timelineArray;
};

const formatOrderDetail = (order) => {
  if (!order) {
    return null;
  }

  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
      id: item._id,
      productId: item.productId?._id ?? item.productId ?? null,
      title: item.title,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      imageUrl: item.imageUrl,
      discount: item.discount,
    }))
    : [];

  return {
    id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    placedAt: order.placedAt,
    confirmedAt: order.confirmedAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    items,
    pricing: order.pricing,
    shipping: order.shipping ?? null,
    delivery: order.delivery ?? null,
    payment: {
      method: order.payment?.method ?? null,
      status: order.payment?.status ?? null,
      transactionId: order.payment?.transactionId ?? null,
      paidAt: order.payment?.paidAt ?? null,
    },
    timeline: Array.isArray(order.timeline) ? order.timeline : [],
    customer: order.customer ?? null,
    support: order.support ?? null,
    notes: order.notes ?? {},
    returnRequest: serializeReturnRequest(order.returnRequest),
  };
};

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
      returnRequest: serializeReturnRequest(order.returnRequest),
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

    const order = await Order.findOne({
      ...buildOrderIdentifierQuery(id),
      userId,
    })
      .populate("items.productId", "title slug category media")
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Format order for response
    const formattedOrder = formatOrderDetail(order);

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

    const order = await Order.findOne(buildOrderIdentifierQuery(id));

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

    const order = await Order.findOne({
      ...buildOrderIdentifierQuery(id),
      userId,
    });

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
 * @desc    Request return for an order
 * @route   POST /api/orders/:id/return
 * @access  Private
 */
exports.requestReturn = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { items = [], reason, customerNotes, evidence = [] } = req.body;

    const normalizedReason =
      typeof reason === "string" ? reason.trim() : "";
    const normalizedCustomerNotes =
      typeof customerNotes === "string" ? customerNotes.trim() : "";

    if (!normalizedReason) {
      return res.status(400).json({
        success: false,
        message: "Return reason is required",
      });
    }

    const order = await Order.findOne({
      ...buildOrderIdentifierQuery(id),
      userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "Only delivered orders can be returned",
      });
    }

    const existingReturnStatus = order.returnRequest?.status;
    if (existingReturnStatus && ACTIVE_RETURN_STATUSES.has(existingReturnStatus)) {
      return res.status(400).json({
        success: false,
        message: "Return request already in progress for this order",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item must be provided for return",
      });
    }

    const sanitizedItems = [];
    const seenItemIds = new Set();

    for (const payload of items) {
      const itemId = payload.itemId;
      if (!itemId) {
        return res.status(400).json({
          success: false,
          message: "Return item identifier is required",
        });
      }

      if (seenItemIds.has(itemId)) {
        return res.status(400).json({
          success: false,
          message: "Duplicate items are not allowed in return request",
        });
      }
      seenItemIds.add(itemId);

      const orderItem = order.items.id(itemId);
      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: "One or more items selected for return are invalid",
        });
      }

      let quantity = orderItem.quantity;
      if (typeof payload.quantity !== "undefined") {
        quantity = Number(payload.quantity);
        if (!Number.isInteger(quantity)) {
          return res.status(400).json({
            success: false,
            message: `Invalid quantity provided for ${orderItem.title}`,
          });
        }
      }

      if (quantity < 1 || quantity > orderItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Return quantity for ${orderItem.title} must be between 1 and ${orderItem.quantity}`,
        });
      }

      sanitizedItems.push({
        itemId: orderItem._id,
        productId: orderItem.productId,
        variantSku: orderItem.variantSku,
        title: orderItem.title,
        quantity,
        unitPrice: orderItem.unitPrice,
      });
    }

    const sanitizedEvidence = Array.isArray(evidence)
      ? evidence
        .filter((entry) => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
      : [];

    const now = new Date();

    order.returnRequest = {
      status: "requested",
      reason: normalizedReason,
      customerNotes: normalizedCustomerNotes,
      adminNotes: null,
      resolution: null,
      requestedAt: now,
      updatedAt: now,
      resolvedAt: null,
      processedBy: null,
      items: sanitizedItems,
      evidence: sanitizedEvidence,
    };

    order.markModified("returnRequest");

    appendReturnTimelineEvent(
      order,
      "requested",
      normalizedCustomerNotes || normalizedReason
    );
    order.markModified("timeline");

    await order.save();

    const refreshedOrder = await Order.findOne({
      _id: order._id,
      userId,
    })
      .populate("items.productId", "title slug category media")
      .lean();

    const formattedOrder = formatOrderDetail(refreshedOrder);

    res.status(201).json({
      success: true,
      message: "Return request submitted successfully",
      data: {
        order: formattedOrder,
      },
    });
  } catch (error) {
    console.error("Request return error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit return request",
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
 * @desc    Update return request status (Admin)
 * @route   PATCH /api/orders/:id/return
 * @access  Private (Admin)
 */
exports.updateReturnRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, resolution, refundAmount, evidence } = req.body;
    const adminId = req.user._id;

    const order = await Order.findOne(buildOrderIdentifierQuery(id));

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.returnRequest || !order.returnRequest.status) {
      return res.status(400).json({
        success: false,
        message: "No return request found for this order",
      });
    }

    const currentStatus = order.returnRequest.status;
    const normalizedStatus =
      typeof status === "string" ? status.trim() : status;
    if (!ALL_RETURN_STATUSES.has(normalizedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid return status provided",
      });
    }
    const allowedTransitions = RETURN_STATUS_TRANSITIONS[currentStatus] || [];

    if (
      normalizedStatus !== currentStatus &&
      !allowedTransitions.includes(normalizedStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition return request from ${currentStatus} to ${normalizedStatus}`,
      });
    }

    const now = new Date();
    const notesProvided = typeof adminNotes !== "undefined";
    const resolutionProvided = typeof resolution !== "undefined";
    const refundProvided = typeof refundAmount !== "undefined";
    const evidenceProvided = Array.isArray(evidence);

    if (normalizedStatus !== currentStatus) {
      appendReturnTimelineEvent(order, normalizedStatus, adminNotes);
      order.markModified("timeline");
    }

    order.returnRequest.status = normalizedStatus;
    order.returnRequest.updatedAt = now;
    order.returnRequest.processedBy = adminId;

    if (notesProvided) {
      order.returnRequest.adminNotes = adminNotes;
    }

    if (resolutionProvided) {
      order.returnRequest.resolution = resolution;
    }

    if (refundProvided) {
      if (refundAmount === null) {
        order.returnRequest.refundAmount = undefined;
      } else {
        const numericRefund = Number(refundAmount);
        if (Number.isNaN(numericRefund)) {
          return res.status(400).json({
            success: false,
            message: "Refund amount must be a valid number",
          });
        }
        order.returnRequest.refundAmount = numericRefund;
      }
    }

    if (evidenceProvided) {
      order.returnRequest.evidence = evidence
        .filter((entry) => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    if (FINAL_RETURN_STATUSES.has(normalizedStatus)) {
      order.returnRequest.resolvedAt = now;
    } else if (FINAL_RETURN_STATUSES.has(currentStatus)) {
      order.returnRequest.resolvedAt = null;
    }

    order.markModified("returnRequest");

    await order.save();

    res.json({
      success: true,
      message: "Return request updated successfully",
      data: {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          returnRequest: serializeReturnRequest(order.returnRequest),
        },
      },
    });
  } catch (error) {
    console.error("Update return request error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update return request",
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
      returnStatus,
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
    const normalizedReturnStatus =
      typeof returnStatus === "string" ? returnStatus.trim() : "";
    if (normalizedReturnStatus && ALL_RETURN_STATUSES.has(normalizedReturnStatus)) {
      filter["returnRequest.status"] = normalizedReturnStatus;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get orders
    const orders = await Order.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "fullName email mobileNumber role")
      .lean();

    // Get total count
    const totalOrders = await Order.countDocuments(filter);

    // Format orders for response
    const formattedOrders = orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      updatedAt: order.updatedAt,
      customer: {
        id: order.userId?._id ?? order.customer?.id ?? null,
        name:
          order.customer?.name ??
          order.userId?.fullName ??
          order.userId?.name ??
          null,
        email: order.customer?.email ?? order.userId?.email ?? null,
        phone:
          order.customer?.phone ??
          order.userId?.mobileNumber ??
          order.userId?.phone ??
          null,
      },
      itemCount: Array.isArray(order.items) ? order.items.length : 0,
      items: Array.isArray(order.items)
        ? order.items.map((item) => ({
          id: item._id,
          productId: item.productId,
          variantSku: item.variantSku,
          title: item.title,
          size: item.size,
          color: item.color,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          imageUrl: item.imageUrl,
        }))
        : [],
      pricing: order.pricing,
      payment: {
        method: order.payment?.method ?? null,
        status: order.payment?.status ?? null,
        transactionId: order.payment?.transactionId ?? null,
        paidAt: order.payment?.paidAt ?? null,
      },
      shipping: order.shipping ?? null,
      delivery: order.delivery ?? null,
      timeline: Array.isArray(order.timeline) ? order.timeline : [],
      notes: order.notes ?? {},
      support: order.support ?? {},
      returnRequest: serializeReturnRequest(order.returnRequest),
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

    const order = await Order.findOne(buildOrderIdentifierQuery(id));

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
