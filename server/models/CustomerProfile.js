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

    // Membership information
    membership: {
      tier: {
        type: String,
        enum: ["Bronze", "Silver", "Gold", "Emerald", "Sapphire Elite"],
        default: "Bronze",
      },
      memberSince: {
        type: Date,
        default: Date.now,
      },
      nextTier: {
        name: String,
        progressPercent: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        pointsNeeded: {
          type: Number,
          default: 0,
        },
      },
    },

    // Rewards and wallet
    rewards: {
      rewardPoints: {
        type: Number,
        default: 0,
        min: 0,
      },
      walletBalance: {
        type: Number,
        default: 0,
        min: 0,
      },
      walletExpiryDate: Date,
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
      wishlistCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      returnCount: {
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

    // Referral information
    referral: {
      referralCode: {
        type: String,
        unique: true,
        sparse: true,
      },
      referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      referredUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      referralRewards: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
customerProfileSchema.index({ userId: 1 });
customerProfileSchema.index({ "referral.referralCode": 1 });
customerProfileSchema.index({ "membership.tier": 1 });

// Method to add reward points
customerProfileSchema.methods.addRewardPoints = function (points, reason) {
  this.rewards.rewardPoints += points;
  this.updateMembershipTier();
};

// Method to deduct reward points
customerProfileSchema.methods.deductRewardPoints = function (points) {
  if (this.rewards.rewardPoints >= points) {
    this.rewards.rewardPoints -= points;
    return true;
  }
  return false;
};

// Method to add to wallet
customerProfileSchema.methods.addToWallet = function (amount, expiryDate) {
  this.rewards.walletBalance += amount;
  if (expiryDate) {
    this.rewards.walletExpiryDate = expiryDate;
  }
};

// Method to deduct from wallet
customerProfileSchema.methods.deductFromWallet = function (amount) {
  if (this.rewards.walletBalance >= amount) {
    this.rewards.walletBalance -= amount;
    return true;
  }
  return false;
};

// Method to update membership tier based on total spent
customerProfileSchema.methods.updateMembershipTier = function () {
  const tierThresholds = {
    Bronze: 0,
    Silver: 10000,
    Gold: 50000,
    Emerald: 100000,
    "Sapphire Elite": 250000,
  };

  const tiers = Object.keys(tierThresholds);
  let newTier = "Bronze";

  for (const tier of tiers) {
    if (this.stats.totalSpent >= tierThresholds[tier]) {
      newTier = tier;
    }
  }

  this.membership.tier = newTier;

  // Calculate progress to next tier
  const currentIndex = tiers.indexOf(newTier);
  if (currentIndex < tiers.length - 1) {
    const nextTier = tiers[currentIndex + 1];
    const nextThreshold = tierThresholds[nextTier];
    const currentThreshold = tierThresholds[newTier];
    const progress = this.stats.totalSpent - currentThreshold;
    const needed = nextThreshold - currentThreshold;

    this.membership.nextTier = {
      name: nextTier,
      progressPercent: Math.round((progress / needed) * 100),
      pointsNeeded: nextThreshold - this.stats.totalSpent,
    };
  } else {
    this.membership.nextTier = {
      name: "Max tier reached",
      progressPercent: 100,
      pointsNeeded: 0,
    };
  }
};

// Method to record order
customerProfileSchema.methods.recordOrder = function (orderAmount) {
  this.stats.totalOrders += 1;
  this.stats.totalSpent += orderAmount;

  // Award reward points (1 point per ₹100 spent)
  const pointsEarned = Math.floor(orderAmount / 100);
  this.addRewardPoints(pointsEarned, "order");
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

// Method to generate referral code
customerProfileSchema.methods.generateReferralCode = async function () {
  const User = mongoose.model("User");
  const user = await User.findById(this.userId);

  if (!user) return null;

  // Generate code from name + random string
  const name = (user.fullName || user.mobileNumber).replace(/\s+/g, "").substring(0, 6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `${name}${random}`;

  this.referral.referralCode = code;
  return code;
};

// Static method to get profile summary for account page
customerProfileSchema.statics.getAccountSummary = async function (userId) {
  const profile = await this.findOne({ userId }).populate("userId");

  if (!profile) return null;

  const User = mongoose.model("User");
  const Order = mongoose.model("Order");
  const Wishlist = mongoose.model("Wishlist");

  const user = await User.findById(userId);
  const recentOrderDocs = await Order.find({ userId })
    .sort({ placedAt: -1 })
    .limit(5);
  const wishlist = await Wishlist.findOne({ userId });

  return {
    profile: {
      id: user._id,
      name: user.fullName,
      email: user.email,
      phone: user.mobileNumber,
      memberSince: profile.membership.memberSince,
      membershipTier: profile.membership.tier,
      rewardPoints: profile.rewards.rewardPoints,
      walletBalance: profile.rewards.walletBalance,
      nextTier: profile.membership.nextTier,
      birthday: profile.birthday,
      avatar: profile.avatar,
    },
    stats: [
      {
        id: "orders",
        label: "Orders placed",
        value: profile.stats.totalOrders,
        trend: `${recentOrderDocs.length} this year`,
      },
      {
        id: "wishlist",
        label: "Wishlist items",
        value: wishlist ? wishlist.items.length : 0,
        trend: "Recent saves",
      },
      {
        id: "credits",
        label: "Wallet credits",
        value: profile.rewards.walletBalance,
        trend: profile.rewards.walletExpiryDate
          ? `Expires ${profile.rewards.walletExpiryDate.toLocaleDateString()}`
          : "No expiry",
      },
      {
        id: "returns",
        label: "Returns",
        value: profile.stats.returnCount,
        trend: "All resolved",
      },
    ],
    recentOrders: recentOrderDocs.map((order) => {
      const orderId = order.orderNumber ?? order._id.toString();
      const placedAt = order.placedAt ?? order.createdAt ?? new Date();
      const pricing = order.pricing ?? {};
      const delivery = order.delivery ?? {};
      const payment = order.payment ?? {};
      const shipping = order.shipping ?? {};

      const timeline = Array.isArray(order.timeline)
        ? order.timeline.map((entry, index) => ({
          id:
            entry._id?.toString?.() ??
            entry.id ??
            `${orderId}-timeline-${index}`,
          title: entry.title ?? "",
          description: entry.description ?? "",
          status: entry.status ?? null,
          timestamp: entry.timestamp ?? null,
        }))
        : [];

      const deliveredAt = delivery.actualDeliveryDate ?? order.deliveredAt ?? null;
      const returnWindowDays = 7;
      let returnEligibleUntil = null;

      if (deliveredAt) {
        const deadline = new Date(deliveredAt);
        deadline.setDate(deadline.getDate() + returnWindowDays);
        returnEligibleUntil = deadline;
      }

      return {
        id: orderId,
        orderNumber: orderId,
        placedOn: placedAt,
        status: order.status,
        total: pricing.grandTotal ?? 0,
        items: Array.isArray(order.items) ? order.items.length : 0,
        itemsCount: Array.isArray(order.items) ? order.items.length : 0,
        paymentMethod: payment.method ?? "Online payment",
        expectedDelivery: delivery.estimatedDeliveryDate ?? null,
        deliveredOn: deliveredAt,
        trackingNumber: delivery.trackingNumber ?? null,
        courierService: delivery.courierService ?? null,
        delivery: {
          estimatedDeliveryDate: delivery.estimatedDeliveryDate ?? null,
          deliveryWindow: delivery.deliveryWindow ?? null,
          actualDeliveryDate: deliveredAt,
          trackingNumber: delivery.trackingNumber ?? null,
          courierService: delivery.courierService ?? null,
        },
        shipping: {
          recipient: shipping.recipient ?? null,
          city: shipping.city ?? null,
          state: shipping.state ?? null,
          postalCode: shipping.postalCode ?? null,
        },
        timeline,
        returnEligible: Boolean(deliveredAt && (!returnEligibleUntil || returnEligibleUntil >= new Date())),
        returnEligibleUntil,
        returnWindowDays,
      };
    }),
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
