const mongoose = require("mongoose");

// Schema for product variants (size, color combinations)
const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  size: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    hex: {
      type: String,
      trim: true,
    },
  },
  stockLevel: {
    type: Number,
    default: 0,
    min: 0,
  },
  priceOverride: {
    type: Number,
    min: 0,
  },
  images: [String],
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Schema for product media (images, videos)
const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
  },
  alt: {
    type: String,
    default: "",
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ["image", "video"],
    default: "image",
  },
  cloudinaryId: {
    type: String,
  },
  cloudinaryResourceType: {
    type: String,
    enum: ["image", "video", "raw"],
  },
});

// Schema for product specifications
const specificationSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
});

// Schema for product details sections
const detailSectionSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  features: [String],
});

// Schema for review highlights
const reviewHighlightSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
});

// Main Product schema
const productSchema = new mongoose.Schema(
  {
    // Unique identifier for URL (e.g., "classic-white-tee")
    // Used as 'id' in frontend for consistency
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Product title
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Product description
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Brand or collection name for merchandising
    brand: {
      type: String,
      trim: true,
      default: "Ciyatake",
    },

    // Category reference (can be ObjectId or string enum)
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Target gender for the product
    targetGender: {
      type: String,
      required: true,
      enum: ["Men", "Women", "Kids", "Unisex"],
      trim: true,
    },

    // Base price in smallest currency unit (e.g., paise for INR)
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Original listing price (maximum retail price)
    mrp: {
      type: Number,
      min: 0,
    },

    // Optional pre-computed discount percentage for merchandising
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Product media (images, videos)
    media: [mediaSchema],

    // Product benefits/highlights
    benefits: [String],

    // Product details and features
    details: detailSectionSchema,

    // Technical specifications
    specifications: [specificationSchema],

    // Review highlights
    reviewHighlights: [reviewHighlightSchema],

    // Product variants (size/color combinations)
    variants: [variantSchema],

    // Related product IDs
    relatedProductIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],

    // Tags for search and filtering
    tags: [String],

    // Product status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Total stock across all variants (computed field)
    totalStock: {
      type: Number,
      default: 0,
    },

    // Average rating (computed from reviews)
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },

    // Total number of reviews
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // SEO metadata
    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String],
    },
  },
  {
    timestamps: true,
    collection: "product",
  }
);

// Indexes for performance
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ targetGender: 1 });
productSchema.index({ category: 1, targetGender: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ title: "text", description: "text", tags: "text", "seo.keywords": "text" });

// Virtual for availability
productSchema.virtual("isAvailable").get(function () {
  return this.isActive && this.totalStock > 0;
});

// Virtual for 'id' field (frontend compatibility)
productSchema.virtual("id").get(function () {
  return this.slug;
});

// Virtual for primary image URL (backward compatibility)
productSchema.virtual("imageUrl").get(function () {
  const primaryMedia = this.media?.find((m) => m.isPrimary);
  return primaryMedia?.url || this.media?.[0]?.url || "";
});

// Enable virtuals in JSON output
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// Method to update total stock
productSchema.methods.updateTotalStock = function () {
  this.totalStock = this.variants.reduce(
    (sum, variant) => sum + (variant.isActive ? variant.stockLevel : 0),
    0
  );
  return this.totalStock;
};

// Method to get variant by SKU
productSchema.methods.getVariantBySku = function (sku) {
  return this.variants.find((v) => v.sku === sku);
};

// Method to get available sizes (unique list)
productSchema.methods.getAvailableSizes = function () {
  return [...new Set(this.variants.filter((v) => v.isActive).map((v) => v.size))];
};

// Method to get available colors (unique list with hex)
productSchema.methods.getAvailableColors = function () {
  const colorMap = new Map();
  this.variants
    .filter((v) => v.isActive)
    .forEach((v) => {
      if (!colorMap.has(v.color.name)) {
        colorMap.set(v.color.name, {
          value: v.color.name,
          label: v.color.name.charAt(0).toUpperCase() + v.color.name.slice(1),
          hex: v.color.hex || v.color.name,
        });
      }
    });
  return Array.from(colorMap.values());
};

// Method to transform to frontend format
productSchema.methods.toFrontendFormat = function () {
  const effectiveMrp = Number.isFinite(this.mrp) && this.mrp > 0 ? this.mrp : this.basePrice;
  const computedDiscount = Number.isFinite(this.discountPercentage)
    ? this.discountPercentage
    : effectiveMrp > 0 && effectiveMrp > this.basePrice
      ? Math.round(((effectiveMrp - this.basePrice) / effectiveMrp) * 100)
      : 0;

  return {
    id: this.slug,
    title: this.title,
    price: this.basePrice,
    mrp: effectiveMrp,
    discountPercentage: computedDiscount,
    brand: this.brand ?? "Ciyatake",
    category: this.category,
    targetGender: this.targetGender,
    sizes: this.getAvailableSizes(),
    colors: this.getAvailableColors(),
    imageUrl: this.imageUrl,
    description: this.description,
    isAvailable: this.isAvailable,
    averageRating: this.averageRating,
    reviewCount: this.reviewCount,
  };
};

// Pre-save hook to update total stock
productSchema.pre("save", function (next) {
  if (this.isModified("variants")) {
    this.updateTotalStock();
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);
