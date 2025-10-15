const mongoose = require("mongoose");

// Schema for category filters (available sizes, colors, etc.)
const filterOptionsSchema = new mongoose.Schema({
  sizes: [String],
  colors: [
    {
      name: String,
      hex: String,
    },
  ],
  priceRanges: [
    {
      label: String,
      min: Number,
      max: Number,
    },
  ],
});

// Main Category schema
const categorySchema = new mongoose.Schema(
  {
    // Unique identifier for URL (e.g., "clothing", "shoes", "accessories")
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    // Category display name
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Category description
    description: {
      type: String,
      trim: true,
      default: "",
    },

    // Hero/banner image for category page
    heroImage: {
      url: String,
      alt: String,
    },

    // Parent category (for subcategories)
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    // Available filters for this category
    filters: filterOptionsSchema,

    // Target gender for category filtering
    targetGender: {
      type: String,
      enum: ["Men", "Women", "Kids", "Unisex", null],
      default: null,
    },

    // Display order for navigation
    displayOrder: {
      type: Number,
      default: 0,
    },

    // Category status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Product count (computed field)
    productCount: {
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
  }
);

// Indexes for performance
categorySchema.index({ slug: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ isActive: 1, displayOrder: 1 });
categorySchema.index({ targetGender: 1, isActive: 1 });

// Virtual for subcategories
categorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory",
});

module.exports = mongoose.model("Category", categorySchema);
