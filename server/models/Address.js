const mongoose = require("mongoose");

// Main Address schema
const addressSchema = new mongoose.Schema(
  {
    // Owner of the address
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Address label (Home, Office, etc.)
    label: {
      type: String,
      trim: true,
      default: "Home",
    },

    // Recipient information
    recipient: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[+]?[0-9\s\-()]+$/, "Please enter a valid phone number"],
    },

    // Address details
    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine2: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      default: "India",
    },

    // Default address flag
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Address type
    type: {
      type: String,
      enum: ["home", "office", "other"],
      default: "home",
    },

    // Additional delivery instructions
    deliveryInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    // Coordinates for future delivery optimization
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
addressSchema.index({ userId: 1 });
addressSchema.index({ userId: 1, isDefault: 1 });

// Method to format address as single string
addressSchema.methods.getFormattedAddress = function () {
  const parts = [
    this.addressLine1,
    this.addressLine2,
    this.city,
    `${this.state} - ${this.postalCode}`,
    this.country,
  ].filter(Boolean);

  return parts.join(", ");
};

// Pre-save hook to ensure only one default address per user
addressSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    // Remove default flag from other addresses of this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Static method to get default address for a user
addressSchema.statics.getDefaultAddress = async function (userId) {
  let defaultAddress = await this.findOne({ userId, isDefault: true });

  // If no default address, return the most recently created one
  if (!defaultAddress) {
    defaultAddress = await this.findOne({ userId }).sort({ createdAt: -1 });
  }

  return defaultAddress;
};

module.exports = mongoose.model("Address", addressSchema);
