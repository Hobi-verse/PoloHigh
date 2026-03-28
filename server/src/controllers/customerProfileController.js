const CustomerProfile = require("../models/CustomerProfile");
const User = require("../models/User");

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
          stats: profile.stats,
          preferences: profile.preferences,
          birthday: profile.birthday,
          avatar: profile.avatar,
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
