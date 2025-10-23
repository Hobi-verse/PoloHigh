const mongoose = require("mongoose");

// Define the user schema for storing user account information
const userSchema = new mongoose.Schema(
  {
    // User's mobile number for login and OTP verification
    mobileNumber: {
      type: String,
      required: false,
      trim: true,
      set: (value) => {
        if (typeof value === "string") {
          const normalized = value.trim();
          return normalized.length ? normalized : undefined;
        }
        return value;
      },
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },

    // Secure password storage (will be hashed before saving)
    password: {
      type: String,
      required: function () {
        return !this.googleId; // Password not required if Google OAuth
      },
      minlength: [6, "Password must be at least 6 characters long"],
    },

    // Google OAuth ID for social login
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },

    // Profile picture URL (from Google or uploaded)
    profilePicture: {
      type: String,
      default: "",
    },

    // Authentication provider (local, google, etc.)
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // User's full name for personalization
    fullName: {
      type: String,
      trim: true,
      default: "",
    },

    // Email address for communication (now required for login)
    email: {
      type: String,
      required: function () {
        return !this.googleId; // Email required for local auth
      },
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    // User role for access control (customer, admin, etc.)
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },

    // Track if mobile number is verified via OTP
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Store user's shipping addresses
    addresses: [
      {
        street: String,
        city: String,
        state: String,
        pincode: String,
        country: { type: String, default: "India" },
        isDefault: { type: Boolean, default: false },
      },
    ],

    // Track account status for security purposes
    isActive: {
      type: Boolean,
      default: true,
    },

    // Track if additional profile information is required after social login
    profileSetupRequired: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Create partial unique index for mobileNumber (optional field)
userSchema.index(
  { mobileNumber: 1 },
  { 
    unique: true, 
    partialFilterExpression: { mobileNumber: { $type: "string" } },
    name: 'mobileNumber_unique_partial'
  }
);

// Create unique index for email (required field)
userSchema.index(
  { email: 1 },
  { 
    unique: true,
    name: 'email_unique'
  }
);

// Create and export the User model
module.exports = mongoose.model("User", userSchema);
