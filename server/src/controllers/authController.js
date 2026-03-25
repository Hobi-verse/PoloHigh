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

// Send OTP to user's mobile number (stored in DB, logged to console for development)
exports.sendOTP = async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    // Validate mobile number format (10 digits for India)
    if (!mobileNumber || !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number",
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP();

    // Save OTP to database with expiration time
    await OTP.create({
      mobileNumber,
      otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Valid for 10 minutes
    });

    // Log OTP for development (in production, send via SMS service)
    console.log(`\n🔐 OTP for ${mobileNumber}: ${otp}\n`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your mobile number",
      // Return OTP only in development mode
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
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
    const { mobileNumber, otp } = req.body;

    // Validate input fields
    if (!mobileNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and OTP are required",
      });
    }

    // Find the most recent unused OTP for this mobile number
    const otpRecord = await OTP.findOne({
      mobileNumber,
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

    console.log(`OTP verified for ${mobileNumber}`);

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
    const { mobileNumber, password, confirmPassword, fullName, email } = req.body;

    // Validate all required fields
    if (!mobileNumber || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, password, and confirm password are required",
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
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this mobile number already exists",
      });
    }

    // Verify that OTP was verified for this mobile number
    const verifiedOTP = await OTP.findOne({
      mobileNumber,
      isUsed: true,
      expiresAt: { $gt: new Date(Date.now() - 30 * 60 * 1000) }, // Within last 30 minutes
    }).sort({ createdAt: -1 });

    if (!verifiedOTP) {
      return res.status(400).json({
        success: false,
        message: "Please verify your mobile number with OTP first",
      });
    }

    // Hash password for secure storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user account
    const newUser = await User.create({
      mobileNumber,
      password: hashedPassword,
      fullName: fullName || "",
      email: email || "",
      isVerified: true,
    });

    // Create default customer profile for new user if it doesn't exist yet
    try {
      await CustomerProfile.findOneAndUpdate(
        { userId: newUser._id },
        { userId: newUser._id },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } catch (profileError) {
      console.error("Create customer profile error:", profileError);
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      { id: newUser._id, mobileNumber: newUser.mobileNumber, role: newUser.role },
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
    const { mobileNumber, password } = req.body;

    // Validate input fields
    if (!mobileNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Mobile number and password are required",
      });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid mobile number or password",
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
        message: "Invalid mobile number or password",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, mobileNumber: user.mobileNumber, role: user.role },
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        mobileNumber: user.mobileNumber || "", 
        email: user.email,
        role: user.role 
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

    // Redirect to frontend with success
    return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5173"}/login/success?token=${token}`);
    
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

    // Verify OTP
    const otpRecord = await OTP.findOne({
      mobileNumber,
      otp,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

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
      isVerified: true,
    });

    // Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

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
