const User = require("../models/User");
const OTP = require("../models/OTP");
const CustomerProfile = require("../models/CustomerProfile");
const TokenBlacklist = require("../models/TokenBlacklist");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const extractTokenFromRequest = (req) => {
  if (req?.token) {
    return req.token;
  }

  if (
    req?.headers?.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req?.cookies?.token) {
    return req.cookies.token;
  }

  return null;
};

// Send OTP to user's email address
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    console.log(`🔐 Generated OTP for ${email}: ${otp}`);

    // Create OTP document - pre-save hook will automatically send the email
    try {
      await OTP.create({
        email: email.toLowerCase(),
        otp,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // Valid for 15 minutes (matching OTP model)
      });

      console.log(`✅ OTP document created and email sent for: ${email}`);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to your email address",
        // Never return OTP in response for security
      });
    } catch (otpError) {
      console.error("❌ Failed to create OTP or send email:", otpError.message);
      
      // Provide user-friendly error message
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

  } catch (error) {
    console.error("Send OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again",
    });
  }
};

// Verify OTP entered by user
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input fields
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Find the most recent unused OTP for this email
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() }, // Check if OTP is not expired
    }).sort({ createdAt: -1 });

    // Check if OTP is valid
    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Mark OTP as used to prevent reuse
    otpRecord.isUsed = true;
    await otpRecord.save();

    console.log(`OTP verified for ${email}`);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      success: false,
      message: "OTP verification failed. Please try again",
    });
  }
};

// Register new user account after OTP verification
exports.signup = async (req, res) => {
  try {
    const { email, password, confirmPassword, fullName, mobileNumber } = req.body;

    // Validate all required fields
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and confirm password are required",
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email address already exists",
      });
    }

    // Verify that OTP was verified for this email
    const verifiedOTP = await OTP.findOne({
      email: email.toLowerCase(),
      isUsed: true,
      expiresAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, // Within last 30 minutes
    }).sort({ createdAt: -1 });

    if (!verifiedOTP) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email address with OTP first",
      });
    }

    // Hash password for secure storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user account
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      fullName: fullName || "",
      mobileNumber: mobileNumber || undefined,
      isVerified: true,
    });

    // Create default customer profile for new user
    try {
      console.log(`🔄 Creating customer profile for email signup user: ${newUser._id}`);
      const customerProfile = await CustomerProfile.findOneAndUpdate(
        { userId: newUser._id },
        { 
          userId: newUser._id,
          membership: {
            tier: "Bronze",
            memberSince: new Date(),
            nextTier: {
              name: "Silver",
              progressPercent: 0,
              pointsNeeded: 1000
            }
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      console.log(`✅ Email signup - Customer profile created:`, {
        userId: newUser._id,
        profileId: customerProfile._id,
        email: newUser.email,
        tier: customerProfile.membership.tier
      });
    } catch (profileError) {
      console.error("❌ Email signup - Create customer profile error:", profileError);
      // Don't fail the signup if profile creation fails
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" } // Token valid for 7 days
    );

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create account. Please try again",
    });
  }
};

// Login existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Please contact support",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Please try again",
    });
  }
};

// Logout user and invalidate current token
exports.logout = async (req, res) => {
  try {
    const token = extractTokenFromRequest(req);

    if (token) {
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await TokenBlacklist.addToken(token, expiresAt);
    }

    if (typeof res.clearCookie === "function") {
      res.clearCookie("token");
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed. Please try again",
    });
  }
};

// Google OAuth - Initiate authentication
exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Google OAuth - Callback handler
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_auth_failed`);
    }

    const requiresProfileCompletion =
      typeof user.profileSetupRequired === "boolean"
        ? user.profileSetupRequired
        : !user.email;

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email || "",
        mobileNumber: user.mobileNumber || "",
        role: user.role,
        profileSetupRequired: requiresProfileCompletion,
      },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" }
    );

    // Set secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: "lax",
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const redirectUrl = new URL("/login/success", clientUrl);
    redirectUrl.searchParams.set("token", token);
    if (requiresProfileCompletion) {
      redirectUrl.searchParams.set("needsProfile", "1");
    }

    // Redirect to frontend with success
    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error("Google Callback Error:", error);
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_auth_error`);
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};

// Link mobile number to Google account
exports.linkMobileNumber = async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!mobileNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    // Note: This function would need email-based OTP verification
    // For now, keeping basic mobile number linking functionality
    // In production, you might want to send OTP to user's email for mobile verification

    // Check if mobile number is already linked to another account
    const existingUser = await User.findOne({
      mobileNumber,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This mobile number is already linked to another account",
      });
    }

    // Update user with mobile number
    await User.findByIdAndUpdate(userId, {
      mobileNumber,
      profileSetupRequired: false,
    });

    return res.status(200).json({
      success: true,
      message: "Mobile number linked successfully",
    });
  } catch (error) {
    console.error("Link Mobile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to link mobile number",
    });
  }
};
