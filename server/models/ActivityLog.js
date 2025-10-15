const mongoose = require("mongoose");

// Main ActivityLog schema
const activityLogSchema = new mongoose.Schema(
  {
    // Activity type
    type: {
      type: String,
      enum: [
        "order_placed",
        "order_shipped",
        "order_delivered",
        "order_cancelled",
        "user_registered",
        "product_created",
        "product_updated",
        "low_stock_alert",
        "review_submitted",
        "refund_processed",
        "payment_failed",
      ],
      required: true,
    },

    // Activity icon for UI display
    icon: {
      type: String,
      default: "🔔",
    },

    // Activity message
    message: {
      type: String,
      required: true,
    },

    // Related entities
    relatedEntity: {
      entityType: {
        type: String,
        enum: ["order", "user", "product", "review", "payment"],
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: "relatedEntity.entityType",
      },
    },

    // User who triggered the activity (if applicable)
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Additional metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    // Status
    status: {
      type: String,
      enum: ["new", "read", "resolved", "archived"],
      default: "new",
    },

    // For admin notifications
    notifiedAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
activityLogSchema.index({ type: 1, createdAt: -1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ priority: 1 });
activityLogSchema.index({ createdAt: -1 });

// Static method to create activity log
activityLogSchema.statics.logActivity = async function (activityData) {
  return await this.create(activityData);
};

// Static method to get recent activities for dashboard
activityLogSchema.statics.getRecentActivities = async function (limit = 10) {
  const activities = await this.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("triggeredBy", "fullName email");

  return activities.map((activity) => ({
    icon: activity.icon,
    message: activity.message,
    timestamp: this.formatTimestamp(activity.createdAt),
    type: activity.type,
    priority: activity.priority,
    status: activity.status,
  }));
};

// Helper method to format timestamp
activityLogSchema.statics.formatTimestamp = function (date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000); // difference in seconds

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

  return date.toLocaleDateString();
};

// Static method to log order-related activities
activityLogSchema.statics.logOrderActivity = async function (order, type) {
  const icons = {
    order_placed: "🛒",
    order_shipped: "📦",
    order_delivered: "✅",
    order_cancelled: "❌",
  };

  const messages = {
    order_placed: `New order ${order.orderNumber} was placed.`,
    order_shipped: `Order ${order.orderNumber} has been shipped.`,
    order_delivered: `Order ${order.orderNumber} was delivered.`,
    order_cancelled: `Order ${order.orderNumber} was cancelled.`,
  };

  return await this.create({
    type,
    icon: icons[type] || "🛒",
    message: messages[type] || `Order ${order.orderNumber} updated.`,
    relatedEntity: {
      entityType: "order",
      entityId: order._id,
    },
    triggeredBy: order.userId,
    metadata: {
      orderNumber: order.orderNumber,
      amount: order.pricing.grandTotal,
      status: order.status,
    },
  });
};

// Static method to log user-related activities
activityLogSchema.statics.logUserActivity = async function (user, type) {
  const messages = {
    user_registered: `New user registered: ${user.fullName || user.mobileNumber}.`,
  };

  return await this.create({
    type,
    icon: "👤",
    message: messages[type] || "User activity.",
    relatedEntity: {
      entityType: "user",
      entityId: user._id,
    },
    triggeredBy: user._id,
    metadata: {
      userName: user.fullName,
      email: user.email,
      mobileNumber: user.mobileNumber,
    },
  });
};

// Static method to log product-related activities
activityLogSchema.statics.logProductActivity = async function (product, type) {
  const messages = {
    low_stock_alert: `Low stock alert for ${product.title}.`,
    product_created: `New product added: ${product.title}.`,
    product_updated: `Product updated: ${product.title}.`,
  };

  return await this.create({
    type,
    icon: "⚠️",
    message: messages[type] || "Product activity.",
    relatedEntity: {
      entityType: "product",
      entityId: product._id,
    },
    metadata: {
      productName: product.title,
      stockLevel: product.totalStock,
      category: product.category,
    },
    priority: type === "low_stock_alert" ? "high" : "medium",
  });
};

module.exports = mongoose.model("ActivityLog", activityLogSchema);
