const mongoose = require("mongoose");

// Schema for order items
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  variantSku: {
    type: String,
    required: true,
  },

  // Snapshot data (frozen at time of order)
  title: {
    type: String,
    required: true,
  },

  size: {
    type: String,
    required: true,
  },

  color: {
    type: String,
    required: true,
  },

  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  imageUrl: {
    type: String,
  },

  // Item-level discount
  discount: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Subtotal for this item
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Schema for order timeline/tracking
const timelineEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ["complete", "current", "upcoming"],
    default: "upcoming",
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Main Order schema
const orderSchema = new mongoose.Schema(
  {
    // Order number (human-readable)
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Customer reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Order items
    items: [orderItemSchema],

    // Order status
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "packed",
        "shipped",
        "out-for-delivery",
        "delivered",
        "cancelled",
        "refunded",
      ],
      default: "pending",
    },

    // Payment information
    payment: {
      method: {
        type: String,
        required: true,
      },
      transactionId: {
        type: String,
        trim: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paidAt: {
        type: Date,
      },
      paymentMethodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PaymentMethod",
      },
    },

    // Pricing breakdown
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      shipping: {
        type: Number,
        default: 0,
        min: 0,
      },
      tax: {
        type: Number,
        default: 0,
        min: 0,
      },
      discount: {
        type: Number,
        default: 0,
        min: 0,
      },
      grandTotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    // Coupon information
    coupon: {
      couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coupon",
      },
      code: String,
      discountType: String,
      discountValue: Number,
      discountApplied: Number,
    },

    // Shipping information (snapshot of address)
    shipping: {
      recipient: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      instructions: String,
      addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    },

    // Delivery tracking
    delivery: {
      estimatedDeliveryDate: Date,
      deliveryWindow: String,
      actualDeliveryDate: Date,
      trackingNumber: String,
      courierService: String,
    },

    // Return request information
    returnRequest: {
      status: {
        type: String,
        enum: [
          "requested",
          "approved",
          "rejected",
          "in-transit",
          "received",
          "completed",
          "cancelled",
        ],
        default: null,
      },
      reason: String,
      customerNotes: String,
      adminNotes: String,
      resolution: {
        type: String,
        enum: ["refund", "replacement", "store-credit", "exchange"],
      },
      refundAmount: {
        type: Number,
        min: 0,
      },
      requestedAt: Date,
      updatedAt: Date,
      resolvedAt: Date,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      items: [
        {
          itemId: {
            type: mongoose.Schema.Types.ObjectId,
          },
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
          variantSku: String,
          title: String,
          quantity: Number,
          unitPrice: Number,
        },
      ],
      evidence: [String],
    },

    // Order timeline
    timeline: [timelineEventSchema],

    // Customer information snapshot
    customer: {
      name: String,
      email: String,
      phone: String,
    },

    // Support information
    support: {
      email: {
        type: String,
        default: "support@ciyatake.com",
      },
      phone: {
        type: String,
        default: "+91 1800-123-456",
      },
      hours: {
        type: String,
        default: "Monday to Saturday, 10am - 6pm IST",
      },
    },

    // Order notes
    notes: {
      customerNotes: String,
      internalNotes: String,
    },

    // Timestamps
    placedAt: {
      type: Date,
      default: Date.now,
    },

    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ placedAt: -1 });
orderSchema.index({ "returnRequest.status": 1 });

// Virtual for shipping label
orderSchema.virtual("shippingLabel").get(function () {
  return this.pricing.shipping === 0 ? "Free" : `₹${this.pricing.shipping}`;
});

// Method to calculate grand total
orderSchema.methods.calculateGrandTotal = function () {
  const { subtotal, shipping, tax, discount } = this.pricing;
  this.pricing.grandTotal = subtotal + shipping + tax - discount;
  return this.pricing.grandTotal;
};

// Method to update order status
orderSchema.methods.updateStatus = function (newStatus, additionalData = {}) {
  this.status = newStatus;

  // Update relevant timestamps
  const now = new Date();
  switch (newStatus) {
    case "confirmed":
      this.confirmedAt = now;
      this.payment.status = "completed";
      this.payment.paidAt = now;
      break;
    case "shipped":
      this.shippedAt = now;
      break;
    case "delivered":
      this.deliveredAt = now;
      this.delivery.actualDeliveryDate = now;
      break;
    case "cancelled":
      this.cancelledAt = now;
      break;
  }

  // Add timeline event
  this.timeline.push({
    title: this.getStatusTitle(newStatus),
    description: this.getStatusDescription(newStatus),
    status: "complete",
    timestamp: now,
    ...additionalData,
  });
};

// Helper method to get status title
orderSchema.methods.getStatusTitle = function (status) {
  const titles = {
    pending: "Order received",
    confirmed: "Order confirmed",
    processing: "Processing order",
    packed: "Packed and ready",
    shipped: "Shipped",
    "out-for-delivery": "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    refunded: "Refunded",
  };
  return titles[status] || status;
};

// Helper method to get status description
orderSchema.methods.getStatusDescription = function (status) {
  const descriptions = {
    pending: "We've received your order and are processing it.",
    confirmed: "Payment received and order confirmed.",
    processing: "Our team is preparing your items.",
    packed: "Your order is packed and ready for shipment.",
    shipped: "Your order has been shipped.",
    "out-for-delivery": "Your order is on its way to you.",
    delivered: "Your order has been delivered successfully.",
    cancelled: "Your order has been cancelled.",
    refunded: "Your payment has been refunded.",
  };
  return descriptions[status] || "";
};

// Static method to generate unique order number
orderSchema.statics.generateOrderNumber = async function () {
  const prefix = "CYA";
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD

  // Find the last order number for today with correct pattern
  const lastOrder = await this.findOne({
    orderNumber: new RegExp(`^${prefix}-${datePart.slice(0, 4)}-`),
  }).sort({ orderNumber: -1 });

  let sequence = 1000;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.split("-")[2]);
    sequence = lastSequence + 1;
  }

  // Keep generating until we find a unique number
  let attempts = 0;
  while (attempts < 100) { // Prevent infinite loop
    const orderNumber = `${prefix}-${datePart.slice(0, 4)}-${sequence + attempts}`;
    const existingOrder = await this.findOne({ orderNumber });
    if (!existingOrder) {
      return orderNumber;
    }
    attempts++;
  }

  // Fallback with timestamp if we can't find unique number
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${datePart.slice(0, 4)}-${timestamp}`;
};

// Pre-save hook to calculate grand total
orderSchema.pre("save", function (next) {
  if (this.isModified("pricing")) {
    this.calculateGrandTotal();
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
