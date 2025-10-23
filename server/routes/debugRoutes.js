// Debug route to check user and profile creation
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const CustomerProfile = require("../models/CustomerProfile");

// GET /api/v1/auth/debug-profiles - Check all users and their profiles
router.get("/debug-profiles", async (req, res) => {
  try {
    const users = await User.find({}, 'email fullName googleId authProvider createdAt').sort({ createdAt: -1 }).limit(10);
    
    const userProfiles = await Promise.all(
      users.map(async (user) => {
        const profile = await CustomerProfile.findOne({ userId: user._id });
        return {
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            googleId: user.googleId,
            authProvider: user.authProvider,
            createdAt: user.createdAt
          },
          profile: profile ? {
            id: profile._id,
            tier: profile.membership?.tier,
            memberSince: profile.membership?.memberSince,
            rewardPoints: profile.rewards?.rewardPoints
          } : null
        };
      })
    );

    res.json({
      success: true,
      message: "Debug: Recent users and their profiles",
      data: userProfiles,
      stats: {
        totalUsers: users.length,
        usersWithProfiles: userProfiles.filter(up => up.profile !== null).length,
        usersWithoutProfiles: userProfiles.filter(up => up.profile === null).length
      }
    });
  } catch (error) {
    console.error("Debug profiles error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch debug data",
      error: error.message
    });
  }
});

module.exports = router;