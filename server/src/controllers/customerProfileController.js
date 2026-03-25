const CustomerProfile = require("../models/CustomerProfile");
const User = require("../models/User");
const Order = require("../models/Order");
const Wishlist = require("../models/Wishlist");

/**
 * @desc    Get customer profile
 * @route   GET /api/profile
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await CustomerProfile.findOne({ userId }).populate(
      "userId",
      "fullName email mobileNumber"
    );

    // Create profile if doesn't exist
    if (!profile) {
      profile = await CustomerProfile.create({ userId });
      await profile.populate("userId", "fullName email mobileNumber");
    }

    res.json({
      success: true,
      data: {
        profile: {
          id: profile._id,
          userId: profile.userId._id,
          name: profile.userId.fullName,
          email: profile.userId.email,
          phone: profile.userId.mobileNumber,
          membership: profile.membership,
          rewards: profile.rewards,
          stats: profile.stats,
          preferences: profile.preferences,
          birthday: profile.birthday,
          avatar: profile.avatar,
          referral: {
            referralCode: profile.referral.referralCode,
            referralRewards: profile.referral.referralRewards,
            referredCount: profile.referral.referredUsers.length,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Get account summary (for My Account page)
 * @route   GET /api/profile/summary
 * @access  Private
 */
exports.getAccountSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await CustomerProfile.findOne({ userId });

    // Create profile if doesn't exist
    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    const summary = await CustomerProfile.getAccountSummary(userId);

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Get account summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch account summary",
      error: error.message,
    });
  }
};

/**
 * @desc    Update customer profile
 * @route   PUT /api/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { birthday, avatar, fullName, email, mobileNumber } = req.body;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (typeof fullName === "string") {
      user.fullName = fullName.trim();
    }

    if (typeof email === "string") {
      user.email = email.trim();
    }

    if (typeof mobileNumber === "string") {
      const normalizedMobile = mobileNumber.trim();

      if (normalizedMobile !== user.mobileNumber) {
        const existingUser = await User.findOne({ mobileNumber: normalizedMobile });

        if (existingUser && existingUser._id.toString() !== userId.toString()) {
          return res.status(409).json({
            success: false,
            message: "Mobile number is already associated with another account",
          });
        }
      }

      user.mobileNumber = normalizedMobile;
    }

    await user.save();

    // Update allowed fields
    if (birthday !== undefined) {
      profile.birthday = birthday ? new Date(birthday) : null;
    }

    if (avatar) {
      profile.avatar = avatar;
    }

    await profile.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        profile: {
          id: profile._id,
          userId: user._id,
          name: user.fullName,
          email: user.email,
          phone: user.mobileNumber,
          birthday: profile.birthday,
          avatar: profile.avatar,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

/**
 * @desc    Update preferences
 * @route   PATCH /api/profile/preferences
 * @access  Private
 */
exports.updatePreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = req.body;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    // Update preferences
    Object.keys(preferences).forEach((key) => {
      if (profile.preferences[key] !== undefined) {
        profile.preferences[key] = preferences[key];
      }
    });

    await profile.save();

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        preferences: profile.preferences,
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update preferences",
      error: error.message,
    });
  }
};

/**
 * @desc    Get membership details
 * @route   GET /api/profile/membership
 * @access  Private
 */
exports.getMembership = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    // Update membership tier based on spending
    profile.updateMembershipTier();
    await profile.save();

    res.json({
      success: true,
      data: {
        membership: {
          tier: profile.membership.tier,
          memberSince: profile.membership.memberSince,
          nextTier: profile.membership.nextTier,
          benefits: getMembershipBenefits(profile.membership.tier),
          stats: {
            totalOrders: profile.stats.totalOrders,
            totalSpent: profile.stats.totalSpent,
            rewardPoints: profile.rewards.rewardPoints,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get membership error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch membership details",
      error: error.message,
    });
  }
};

/**
 * @desc    Get rewards & wallet details
 * @route   GET /api/profile/rewards
 * @access  Private
 */
exports.getRewards = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    res.json({
      success: true,
      data: {
        rewards: {
          rewardPoints: profile.rewards.rewardPoints,
          walletBalance: profile.rewards.walletBalance,
          walletExpiryDate: profile.rewards.walletExpiryDate,
          pointsValue: Math.floor(profile.rewards.rewardPoints / 10), // ₹1 per 10 points
          conversion: {
            rate: "10 points = ₹1",
            minRedemption: 100,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get rewards error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch rewards",
      error: error.message,
    });
  }
};

/**
 * @desc    Redeem reward points
 * @route   POST /api/profile/rewards/redeem
 * @access  Private
 */
exports.redeemPoints = async (req, res) => {
  try {
    const userId = req.user._id;
    const { points } = req.body;

    // Validate points
    if (!points || points < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum 100 points required for redemption",
      });
    }

    if (points % 10 !== 0) {
      return res.status(400).json({
        success: false,
        message: "Points must be in multiples of 10",
      });
    }

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Check if user has enough points
    if (profile.rewards.rewardPoints < points) {
      return res.status(400).json({
        success: false,
        message: "Insufficient reward points",
      });
    }

    // Redeem points to wallet
    const walletAmount = Math.floor(points / 10); // 10 points = ₹1
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 90); // 90 days expiry

    profile.deductRewardPoints(points);
    profile.addToWallet(walletAmount, expiryDate);

    await profile.save();

    res.json({
      success: true,
      message: `Successfully redeemed ${points} points to ₹${walletAmount} wallet balance`,
      data: {
        pointsRedeemed: points,
        walletAmountAdded: walletAmount,
        remainingPoints: profile.rewards.rewardPoints,
        currentWalletBalance: profile.rewards.walletBalance,
        expiryDate: profile.rewards.walletExpiryDate,
      },
    });
  } catch (error) {
    console.error("Redeem points error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to redeem points",
      error: error.message,
    });
  }
};

/**
 * @desc    Get referral information
 * @route   GET /api/profile/referral
 * @access  Private
 */
exports.getReferral = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await CustomerProfile.findOne({ userId }).populate(
      "referral.referredUsers",
      "fullName mobileNumber"
    );

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    // Generate referral code if doesn't exist
    if (!profile.referral.referralCode) {
      await profile.generateReferralCode();
      await profile.save();
    }

    res.json({
      success: true,
      data: {
        referral: {
          code: profile.referral.referralCode,
          totalRewards: profile.referral.referralRewards,
          referredCount: profile.referral.referredUsers.length,
          referredUsers: profile.referral.referredUsers.map((user) => ({
            name: user.fullName,
            phone: user.mobileNumber,
          })),
          rewards: {
            perReferral: 100, // ₹100 for referrer
            forReferred: 50, // ₹50 for new user
          },
          shareLink: `${process.env.FRONTEND_URL}/register?ref=${profile.referral.referralCode}`,
        },
      },
    });
  } catch (error) {
    console.error("Get referral error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch referral details",
      error: error.message,
    });
  }
};

/**
 * @desc    Apply referral code during registration
 * @route   POST /api/profile/referral/apply
 * @access  Private
 */
exports.applyReferral = async (req, res) => {
  try {
    const userId = req.user._id;
    const { referralCode } = req.body;

    // Find referrer's profile
    const referrerProfile = await CustomerProfile.findOne({
      "referral.referralCode": referralCode,
    });

    if (!referrerProfile) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    // Check if user already used a referral
    let userProfile = await CustomerProfile.findOne({ userId });

    if (!userProfile) {
      userProfile = await CustomerProfile.create({ userId });
    }

    if (userProfile.referral.referredBy) {
      return res.status(400).json({
        success: false,
        message: "You have already used a referral code",
      });
    }

    // Apply referral
    userProfile.referral.referredBy = referrerProfile.userId;
    userProfile.addToWallet(50, null); // ₹50 for new user

    // Update referrer
    referrerProfile.referral.referredUsers.push(userId);
    referrerProfile.referral.referralRewards += 100;
    referrerProfile.addToWallet(100, null); // ₹100 for referrer

    await userProfile.save();
    await referrerProfile.save();

    res.json({
      success: true,
      message: "Referral code applied successfully! ₹50 added to your wallet",
      data: {
        walletBalance: userProfile.rewards.walletBalance,
        referralBonus: 50,
      },
    });
  } catch (error) {
    console.error("Apply referral error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to apply referral code",
      error: error.message,
    });
  }
};

/**
 * @desc    Get security settings
 * @route   GET /api/profile/security
 * @access  Private
 */
exports.getSecurity = async (req, res) => {
  try {
    const userId = req.user._id;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    res.json({
      success: true,
      data: {
        security: {
          twoFactorEnabled: profile.security.twoFactorEnabled,
          lastPasswordChange: profile.security.lastPasswordChange,
          trustedDevices: profile.security.trustedDevices.map((device) => ({
            id: device.deviceId,
            name: device.deviceName,
            lastActive: device.lastActive,
            location: device.location,
            trusted: device.trusted,
          })),
          loginAttempts: {
            count: profile.security.loginAttempts.count,
            lockedUntil: profile.security.loginAttempts.lockedUntil,
          },
        },
      },
    });
  } catch (error) {
    console.error("Get security error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch security settings",
      error: error.message,
    });
  }
};

/**
 * @desc    Enable/disable two-factor authentication
 * @route   PATCH /api/profile/security/2fa
 * @access  Private
 */
exports.toggle2FA = async (req, res) => {
  try {
    const userId = req.user._id;
    const { enabled } = req.body;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    profile.security.twoFactorEnabled = enabled;
    await profile.save();

    res.json({
      success: true,
      message: `Two-factor authentication ${enabled ? "enabled" : "disabled"} successfully`,
      data: {
        twoFactorEnabled: profile.security.twoFactorEnabled,
      },
    });
  } catch (error) {
    console.error("Toggle 2FA error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update 2FA settings",
      error: error.message,
    });
  }
};

/**
 * @desc    Add/update trusted device
 * @route   POST /api/profile/security/device
 * @access  Private
 */
exports.addTrustedDevice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deviceId, deviceName, location, userAgent } = req.body;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      profile = await CustomerProfile.create({ userId });
    }

    profile.addTrustedDevice({
      deviceId,
      deviceName,
      location,
      userAgent,
      trusted: true,
    });

    await profile.save();

    res.json({
      success: true,
      message: "Device added to trusted devices",
      data: {
        trustedDevices: profile.security.trustedDevices,
      },
    });
  } catch (error) {
    console.error("Add trusted device error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add trusted device",
      error: error.message,
    });
  }
};

/**
 * @desc    Remove trusted device
 * @route   DELETE /api/profile/security/device/:deviceId
 * @access  Private
 */
exports.removeTrustedDevice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { deviceId } = req.params;

    let profile = await CustomerProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    // Remove device
    profile.security.trustedDevices = profile.security.trustedDevices.filter(
      (device) => device.deviceId !== deviceId
    );

    await profile.save();

    res.json({
      success: true,
      message: "Device removed from trusted devices",
      data: {
        trustedDevices: profile.security.trustedDevices,
      },
    });
  } catch (error) {
    console.error("Remove trusted device error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove trusted device",
      error: error.message,
    });
  }
};

// Helper function to get membership benefits
function getMembershipBenefits(tier) {
  const benefits = {
    Bronze: [
      "Welcome bonus: 100 reward points",
      "Earn 1 point per ₹100 spent",
      "Birthday special: 5% off",
    ],
    Silver: [
      "All Bronze benefits",
      "Earn 1.5 points per ₹100 spent",
      "Free shipping on orders above ₹2,500",
      "Early access to sales",
    ],
    Gold: [
      "All Silver benefits",
      "Earn 2 points per ₹100 spent",
      "Free shipping on all orders",
      "Exclusive Gold member discounts",
      "Priority customer support",
    ],
    Emerald: [
      "All Gold benefits",
      "Earn 2.5 points per ₹100 spent",
      "Dedicated concierge service",
      "Complimentary gift wrapping",
      "Free express shipping",
    ],
    "Sapphire Elite": [
      "All Emerald benefits",
      "Earn 3 points per ₹100 spent",
      "Personal stylist consultations",
      "Invitation to exclusive events",
      "VIP access to new collections",
      "Anniversary gifts",
    ],
  };

  return benefits[tier] || benefits.Bronze;
}
