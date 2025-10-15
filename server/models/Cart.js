const mongoose = require("mongoose");

// Schema for cart items
const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  productSlug: {
    type: String,
    trim: true,
  },

  // Variant SKU for specific size/color combination
  variantSku: {
    type: String,
    required: true,
  },

  // Snapshot data (in case product details change)
  title: {
    type: String,
    required: true,
  },

  price: {
    type: Number,
    required: true,
    min: 0,
  },

  size: {
    type: String,
    required: true,
  },

  color: {
    type: String,
    required: true,
  },

  imageUrl: {
    type: String,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },

  // For "Save for later" feature
  savedForLater: {
    type: Boolean,
    default: false,
  },

  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Main Cart schema
const cartSchema = new mongoose.Schema(
  {
    // Owner of the cart
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Cart items
    items: [cartItemSchema],

    // Computed totals
    totals: {
      subtotal: {
        type: Number,
        default: 0,
        min: 0,
      },
      itemCount: {
        type: Number,
        default: 0,
        min: 0,
      },
      savedItemCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // Last activity timestamp
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
cartSchema.index({ userId: 1 });
cartSchema.index({ lastActivityAt: 1 }); // For cleaning abandoned carts

// Method to calculate totals
cartSchema.methods.calculateTotals = function () {
  const activeItems = this.items.filter((item) => !item.savedForLater);
  const savedItems = this.items.filter((item) => item.savedForLater);

  this.totals.subtotal = activeItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  this.totals.itemCount = activeItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  this.totals.savedItemCount = savedItems.length;

  return this.totals;
};

// Method to add item to cart
cartSchema.methods.addItem = function (itemData) {
  // Check if item already exists (same product and variant)
  const existingItem = this.items.find(
    (item) =>
      item.productId.toString() === itemData.productId.toString() &&
      item.variantSku === itemData.variantSku &&
      !item.savedForLater
  );

  if (existingItem) {
    // Update quantity
    existingItem.quantity += itemData.quantity || 1;
  } else {
    // Add new item
    this.items.push(itemData);
  }

  this.lastActivityAt = new Date();
  this.calculateTotals();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function (itemId, quantity) {
  const item = this.items.id(itemId);
  if (item) {
    item.quantity = quantity;
    this.lastActivityAt = new Date();
    this.calculateTotals();
  }
};

// Method to remove item
cartSchema.methods.removeItem = function (itemId) {
  this.items.pull(itemId);
  this.lastActivityAt = new Date();
  this.calculateTotals();
};

// Method to save item for later
cartSchema.methods.saveItemForLater = function (itemId) {
  const item = this.items.id(itemId);
  if (item) {
    item.savedForLater = true;
    this.lastActivityAt = new Date();
    this.calculateTotals();
  }
};

// Method to move item back to cart
cartSchema.methods.moveItemToCart = function (itemId) {
  const item = this.items.id(itemId);
  if (item) {
    item.savedForLater = false;
    this.lastActivityAt = new Date();
    this.calculateTotals();
  }
};

// Method to clear cart
cartSchema.methods.clearCart = function () {
  this.items = [];
  this.calculateTotals();
};

// Pre-save hook to update totals
cartSchema.pre("save", function (next) {
  this.calculateTotals();
  next();
});

module.exports = mongoose.model("Cart", cartSchema);
