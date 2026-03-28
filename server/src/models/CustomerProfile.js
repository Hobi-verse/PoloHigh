const mongoose = require("mongoose");

// Schema for trusted devices
const trustedDeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
  },
  deviceName: {
    type: String,
    required: true,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
  },
  trusted: {
    type: Boolean,
    default: false,
  },
  userAgent: {
    type: String,
  },
});

// Schema for support tickets
const supportTicketSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["open", "in-progress", "resolved", "closed"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: Date,
});

// Main CustomerProfile schema
const customerProfileSchema = new mongoose.Schema(
  {
    // Reference to User
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Account statistics
    stats: {
      totalOrders: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalSpent: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // User preferences
    preferences: {
      marketingEmails: {
        type: Boolean,
        default: true,
      },
      smsUpdates: {
        type: Boolean,
        default: true,
      },
      whatsappUpdates: {
        type: Boolean,
        default: false,
      },
      orderReminders: {
        type: Boolean,
        default: true,
      },
      securityAlerts: {
        type: Boolean,
        default: true,
      },
      language: {
        type: String,
        default: "en",
      },
      currency: {
        type: String,
        default: "INR",
      },
    },

    // Security settings
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },
      lastPasswordChange: {
        type: Date,
        default: Date.now,
      },
      trustedDevices: [trustedDeviceSchema],
      loginAttempts: {
        count: {
          type: Number,
          default: 0,
        },
        lastAttempt: Date,
        lockedUntil: Date,
      },
    },

    // Support information
    support: {
      concierge: {
        name: {
          type: String,
          default: "Ciyatake Care",
        },
        email: {
          type: String,
          default: "support@ciyatake.com",
        },
        phone: {
          type: String,
          default: "+91 90876 54321",
        },
        hours: {
          type: String,
          default: "All days, 9 AM – 9 PM",
        },
      },
      tickets: [supportTicketSchema],
    },

    // Profile avatar
    avatar: {
      url: String,
      cloudinaryId: String,
    },

    // Birthday (for special offers)
    birthday: Date,

  },
  {
    timestamps: true,
  }
);

// Method to record order
customerProfileSchema.methods.recordOrder = function (orderAmount) {
  this.stats.totalOrders += 1;
  this.stats.totalSpent += orderAmount;
};

// Method to add trusted device
customerProfileSchema.methods.addTrustedDevice = function (deviceInfo) {
  // Check if device already exists
  const existingDevice = this.security.trustedDevices.find(
    (d) => d.deviceId === deviceInfo.deviceId
  );

  if (existingDevice) {
    existingDevice.lastActive = new Date();
    existingDevice.location = deviceInfo.location || existingDevice.location;
  } else {
    this.security.trustedDevices.push({
      ...deviceInfo,
      lastActive: new Date(),
    });
  }
};

// Static method to get profile summary for account page
customerProfileSchema.statics.getAccountSummary = async function (userId) {
  const profile = await this.findOne({ userId }).populate("userId");

  if (!profile) return null;

  const Order = mongoose.model("Order");
  const recentOrders = await Order.find({ userId })
    .sort({ placedAt: -1 })
    .limit(5);
  const user = profile.userId;

  return {
    profile: {
      id: user._id,
      name: user.fullName,
      email: user.email,
      phone: user.mobileNumber,
      birthday: profile.birthday,
      avatar: profile.avatar,
    },
    recentOrders: recentOrders.map((order) => ({
      id: order.orderNumber,
      placedOn: order.placedAt.toISOString().split("T")[0],
      status: order.status,
      total: order.pricing.grandTotal,
      items: order.items.length,
      expectedDelivery: order.delivery.estimatedDeliveryDate,
      paymentMethod: order.payment.method,
    })),
    preferences: profile.preferences,
    security: {
      lastPasswordChange: profile.security.lastPasswordChange,
      twoFactorEnabled: profile.security.twoFactorEnabled,
      trustedDevices: profile.security.trustedDevices,
    },
    support: profile.support,
  };
};

module.exports = mongoose.model("CustomerProfile", customerProfileSchema);
