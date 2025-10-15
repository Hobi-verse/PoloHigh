const mongoose = require("mongoose");

// Schema for wishlist items
const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  productSlug: {
    type: String,
    trim: true,
  },

  // Variant SKU for specific size/color combination (optional)
  variantSku: {
    type: String,
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
  },

  color: {
    type: String,
  },

  imageUrl: {
    type: String,
  },

  // Stock availability (computed from product)
  inStock: {
    type: Boolean,
    default: true,
  },

  // When item was added to wishlist
  addedAt: {
    type: Date,
    default: Date.now,
  },

  // Priority level for user organization
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },

  // User notes about the item
  notes: {
    type: String,
    trim: true,
    maxlength: 500,
  },
});

// Main Wishlist schema
const wishlistSchema = new mongoose.Schema(
  {
    // Owner of the wishlist
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Wishlist items
    items: [wishlistItemSchema],

    // Wishlist name (for multiple wishlists feature)
    name: {
      type: String,
      default: "My Wishlist",
      trim: true,
    },

    // Wishlist privacy setting
    isPublic: {
      type: Boolean,
      default: false,
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
wishlistSchema.index({ userId: 1 });
wishlistSchema.index({ "items.productId": 1 });
wishlistSchema.index({ lastActivityAt: 1 });

// Method to add item to wishlist
wishlistSchema.methods.addItem = function (itemData) {
  // Check if item already exists
  const existingItem = this.items.find(
    (item) =>
      item.productId.toString() === itemData.productId.toString() &&
      (itemData.variantSku ? item.variantSku === itemData.variantSku : true)
  );

  if (!existingItem) {
    this.items.push(itemData);
    this.lastActivityAt = new Date();
  }

  return !existingItem; // Returns true if item was added
};

// Method to remove item
wishlistSchema.methods.removeItem = function (itemId) {
  this.items.pull(itemId);
  this.lastActivityAt = new Date();
};

// Method to update item stock status
wishlistSchema.methods.updateItemStock = async function () {
  const Product = mongoose.model("Product");

  for (const item of this.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      item.title = product.title;
      item.imageUrl =
        product.media?.find((m) => m.isPrimary)?.url || product.media?.[0]?.url;
      item.productSlug = product.slug;

      if (item.variantSku) {
        const variant = product.getVariantBySku(item.variantSku);
        if (variant) {
          item.inStock = variant.stockLevel > 0;
          item.size = variant.size;
          item.color = variant.color?.name || item.color;
          item.price =
            variant.priceOverride ??
            variant.price ??
            product.salePrice ??
            product.basePrice;
        } else {
          item.inStock = false;
        }
        item.price = variant.priceOverride;
        item.inStock = product.totalStock > 0;
        item.size = null;
        item.color = null;
        item.price = product.salePrice ?? product.basePrice;
        item.price = product.basePrice;
      }
    } else {
      item.inStock = false;
    }
  }
};

// Method to clear wishlist
wishlistSchema.methods.clearWishlist = function () {
  this.items = [];
  this.lastActivityAt = new Date();
};

// Virtual for item count
wishlistSchema.virtual("itemCount").get(function () {
  return this.items.length;
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
