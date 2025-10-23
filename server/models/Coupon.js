const mongoose = require("mongoose");

// Main Coupon schema
const couponSchema = new mongoose.Schema(
  {
    // Coupon code (unique)
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Coupon description
    description: {
      type: String,
      trim: true,
    },

    // Discount type
    discountType: {
      type: String,
      enum: ["percentage", "fixed", "freeShipping"],
      required: true,
    },

    // Discount value
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },

    // Maximum discount amount (for percentage discounts)
    maxDiscount: {
      type: Number,
      min: 0,
    },

    // Minimum order amount to apply coupon
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Validity period
    validity: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },

    // Usage limits
    usageLimit: {
      total: {
        type: Number,
        default: null, // null means unlimited
      },
      perUser: {
        type: Number,
        default: 1,
      },
    },

    // Current usage count
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Users who have used this coupon
    usedBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedAt: {
          type: Date,
          default: Date.now,
        },
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        discountApplied: Number,
      },
    ],

    // Applicable categories
    applicableCategories: [String],

    // Applicable products
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Excluded products
    excludedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // User eligibility
    eligibility: {
      newUsersOnly: {
        type: Boolean,
        default: false,
      },
      membershipTiers: [String], // e.g., ["Gold", "Emerald"]
      specificUsers: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },

    // Coupon status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Created by (admin)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Coupon type/campaign
    campaignType: {
      type: String,
      enum: ["promotional", "seasonal", "referral", "loyalty", "custom"],
      default: "promotional",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes (code index is already created by unique: true)
couponSchema.index({ isActive: 1 });
couponSchema.index({ "validity.startDate": 1, "validity.endDate": 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();

  // Check if active
  if (!this.isActive) return { valid: false, reason: "Coupon is inactive" };

  // Check validity period
  if (now < this.validity.startDate)
    return { valid: false, reason: "Coupon not yet valid" };
  if (now > this.validity.endDate)
    return { valid: false, reason: "Coupon has expired" };

  // Check total usage limit
  if (this.usageLimit.total && this.usageCount >= this.usageLimit.total)
    return { valid: false, reason: "Coupon usage limit reached" };

  return { valid: true };
};

// Method to check if user can use coupon
couponSchema.methods.canUserUse = function (userId, orderAmount, customerProfile) {
  // Check basic validity
  const validityCheck = this.isValid();
  if (!validityCheck.valid) return validityCheck;

  // Check minimum order amount
  if (orderAmount < this.minOrderAmount)
    return {
      valid: false,
      reason: `Minimum order amount is ₹${this.minOrderAmount}`,
    };

  // Check per-user usage limit
  const userUsageCount = this.usedBy.filter(
    (u) => u.userId.toString() === userId.toString()
  ).length;

  if (userUsageCount >= this.usageLimit.perUser)
    return {
      valid: false,
      reason: "You have already used this coupon maximum times",
    };

  // Check new users only
  if (this.eligibility.newUsersOnly && customerProfile?.stats.totalOrders > 0)
    return { valid: false, reason: "This coupon is only for new users" };

  // Check membership tier
  if (
    this.eligibility.membershipTiers.length > 0 &&
    !this.eligibility.membershipTiers.includes(customerProfile?.membership.tier)
  )
    return { valid: false, reason: "This coupon is not available for your membership tier" };

  // Check specific users
  if (
    this.eligibility.specificUsers.length > 0 &&
    !this.eligibility.specificUsers.some((id) => id.toString() === userId.toString())
  )
    return { valid: false, reason: "This coupon is not available for you" };

  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (orderAmount) {
  let discount = 0;

  switch (this.discountType) {
    case "percentage":
      discount = (orderAmount * this.discountValue) / 100;
      if (this.maxDiscount) {
        discount = Math.min(discount, this.maxDiscount);
      }
      break;
    case "fixed":
      discount = this.discountValue;
      break;
    case "freeShipping":
      discount = 0; // Shipping discount handled separately
      break;
  }

  // Ensure discount doesn't exceed order amount
  return Math.min(discount, orderAmount);
};

// Method to apply coupon
couponSchema.methods.applyCoupon = function (userId, orderId, discountApplied) {
  this.usedBy.push({
    userId,
    orderId,
    discountApplied,
    usedAt: new Date(),
  });
  this.usageCount += 1;
};

// Static method to find valid coupon by code
couponSchema.statics.findValidCoupon = async function (code) {
  const coupon = await this.findOne({ code: code.toUpperCase() });

  if (!coupon) return null;

  const validityCheck = coupon.isValid();
  if (!validityCheck.valid) return null;

  return coupon;
};

module.exports = mongoose.model("Coupon", couponSchema);
