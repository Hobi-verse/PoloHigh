const mongoose = require("mongoose");

// Main PaymentMethod schema
const paymentMethodSchema = new mongoose.Schema(
  {
    // Owner of the payment method
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Payment method type
    type: {
      type: String,
      enum: ["card", "upi", "wallet", "netbanking", "cod"],
      required: true,
    },

    // Card/Payment brand (Visa, Mastercard, BHIM UPI, etc.)
    brand: {
      type: String,
      trim: true,
    },

    // Card holder name
    holderName: {
      type: String,
      trim: true,
    },

    // Last 4 digits of card number (for display)
    last4: {
      type: String,
      trim: true,
      match: [/^\d{4}$/, "Last 4 digits must be exactly 4 numbers"],
    },

    // Card expiry (MM/YY format)
    expiry: {
      type: String,
      trim: true,
      match: [/^\d{2}\/\d{2}$/, "Expiry must be in MM/YY format"],
    },

    // UPI handle/VPA
    upiHandle: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // Wallet balance (for wallet type)
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Tokenized payment identifier (from payment gateway)
    paymentToken: {
      type: String,
      trim: true,
    },

    // Default payment method flag
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Payment method status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Nickname for the payment method
    nickname: {
      type: String,
      trim: true,
    },

    // Billing address reference
    billingAddressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
paymentMethodSchema.index({ userId: 1 });
paymentMethodSchema.index({ userId: 1, isDefault: 1 });
paymentMethodSchema.index({ userId: 1, type: 1 });

// Virtual for masked display
paymentMethodSchema.virtual("displayName").get(function () {
  switch (this.type) {
    case "card":
      return `${this.brand} •••• ${this.last4}`;
    case "upi":
      return this.upiHandle || "UPI";
    case "wallet":
      return `${this.brand || "Wallet"} (₹${this.walletBalance})`;
    case "netbanking":
      return this.brand || "Net Banking";
    case "cod":
      return "Cash on Delivery";
    default:
      return this.type;
  }
});

// Method to validate card expiry
paymentMethodSchema.methods.isCardExpired = function () {
  if (this.type !== "card" || !this.expiry) {
    return false;
  }

  const [month, year] = this.expiry.split("/").map(Number);
  const expiryDate = new Date(2000 + year, month - 1); // Convert YY to full year
  const now = new Date();

  return expiryDate < now;
};

// Pre-save hook to ensure only one default payment method per user
paymentMethodSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    // Remove default flag from other payment methods of this user
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    );
  }
  next();
});

// Static method to get default payment method for a user
paymentMethodSchema.statics.getDefaultPaymentMethod = async function (userId) {
  let defaultMethod = await this.findOne({
    userId,
    isDefault: true,
    isActive: true,
  });

  // If no default payment method, return the most recently created one
  if (!defaultMethod) {
    defaultMethod = await this.findOne({ userId, isActive: true }).sort({
      createdAt: -1,
    });
  }

  return defaultMethod;
};

// Method to update wallet balance
paymentMethodSchema.methods.addToWallet = function (amount) {
  if (this.type === "wallet") {
    this.walletBalance += amount;
  }
};

paymentMethodSchema.methods.deductFromWallet = function (amount) {
  if (this.type === "wallet" && this.walletBalance >= amount) {
    this.walletBalance -= amount;
    return true;
  }
  return false;
};

module.exports = mongoose.model("PaymentMethod", paymentMethodSchema);
