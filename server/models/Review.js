const mongoose = require("mongoose");

// Main Review schema
const reviewSchema = new mongoose.Schema(
  {
    // Product being reviewed
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // User who wrote the review
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Order reference (to verify purchase)
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    // Rating (1-5 stars)
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    // Review title
    title: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    // Review content
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Review images
    images: [
      {
        url: String,
        cloudinaryId: String,
        alt: String,
      },
    ],

    // Verified purchase
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },

    // Review status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Helpful votes
    helpfulVotes: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Users who found this helpful
    helpfulBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Admin response
    adminResponse: {
      message: String,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      respondedAt: Date,
    },

    // Metadata
    variant: {
      size: String,
      color: String,
    },

    // Moderation
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    moderatedAt: Date,
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
reviewSchema.index({ productId: 1, status: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Method to mark as helpful
reviewSchema.methods.markAsHelpful = function (userId) {
  if (!this.helpfulBy.includes(userId)) {
    this.helpfulBy.push(userId);
    this.helpfulVotes += 1;
  }
};

// Method to remove helpful mark
reviewSchema.methods.removeHelpful = function (userId) {
  const index = this.helpfulBy.indexOf(userId);
  if (index > -1) {
    this.helpfulBy.splice(index, 1);
    this.helpfulVotes -= 1;
  }
};

// Static method to calculate average rating for a product
reviewSchema.statics.calculateProductRating = async function (productId) {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return { averageRating: 0, reviewCount: 0 };
  }

  const targetProductId =
    typeof productId === "string" ? new mongoose.Types.ObjectId(productId) : productId;

  const result = await this.aggregate([
    { $match: { productId: targetProductId, status: "approved" } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    return {
      averageRating: Math.round(result[0].averageRating * 10) / 10,
      reviewCount: result[0].reviewCount,
    };
  }

  return { averageRating: 0, reviewCount: 0 };
};

// Post-save hook to update product rating
reviewSchema.post("save", async function () {
  if (this.status === "approved") {
    const Product = mongoose.model("Product");
    const { averageRating, reviewCount } = await this.constructor.calculateProductRating(
      this.productId
    );

    await Product.findByIdAndUpdate(this.productId, {
      averageRating,
      reviewCount,
    });
  }
});

module.exports = mongoose.model("Review", reviewSchema);
