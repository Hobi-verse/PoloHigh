const jwt = require("jsonwebtoken");
const User = require("../models/User");
const TokenBlacklist = require("../models/TokenBlacklist");

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Check for token in cookies (if using cookie-based auth)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please log in.",
      });
    }

    try {
      if (await TokenBlacklist.hasToken(token)) {
        return res.status(401).json({
          success: false,
          message: "Your session has ended. Please log in again.",
        });
      }

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-change-in-production"
      );

      // Get user from token
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Token invalid.",
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated. Please contact support.",
        });
      }

      // Attach user to request object
      req.user = user;
      req.token = token;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

// Admin only middleware
exports.adminOnly = async (req, res, next) => {
  try {
    // Check if user is authenticated (protect middleware should run first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in.",
      });
    }

    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error);
    res.status(500).json({
      success: false,
      message: "Authorization failed",
      error: error.message,
    });
  }
};

// Restrict to specific roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (protect middleware should run first)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Please log in.",
        });
      }

      // Check if user's role is in the allowed roles
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. This route is restricted to ${roles.join(", ")} only.`,
        });
      }

      next();
    } catch (error) {
      console.error("RestrictTo Middleware Error:", error);
      res.status(500).json({
        success: false,
        message: "Authorization failed",
        error: error.message,
      });
    }
  };
};

// Optional: Check if user owns the resource
exports.ownerOrAdmin = (resourceUserIdField = "userId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Not authorized. Please log in.",
        });
      }

      // Admin can access any resource
      if (req.user.role === "admin") {
        return next();
      }

      // Check if user owns the resource
      const resourceUserId = req[resourceUserIdField] || req.params[resourceUserIdField];

      if (resourceUserId && resourceUserId.toString() === req.user._id.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: "Access denied. You don't have permission to access this resource.",
      });
    } catch (error) {
      console.error("Owner/Admin Middleware Error:", error);
      res.status(500).json({
        success: false,
        message: "Authorization failed",
        error: error.message,
      });
    }
  };
};
