const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

const resolveProductId = async (identifier) => {
  if (!identifier) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return identifier;
  }

  const normalized = typeof identifier === "string" ? identifier.trim().toLowerCase() : identifier;
  if (!normalized) {
    return null;
  }

  const product = await Product.findOne({ slug: normalized }).select("_id");
  return product ? product._id.toString() : null;
};

/**
 * @desc    Create a new review
 * @route   POST /api/reviews
 * @access  Private
 */
exports.createReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      productId: productIdentifier,
      orderId,
      rating,
      title,
      comment,
      images,
      variant,
    } = req.body;

    const resolvedProductId = await resolveProductId(productIdentifier);

    if (!resolvedProductId) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 1. Check if product exists
    const product = await Product.findById(resolvedProductId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 2. Check if user already reviewed this product
    const existingReview = await Review.findOne({
      userId,
      productId: resolvedProductId,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product. You can update your existing review instead.",
      });
    }

    // 3. Verify purchase if orderId provided
    let isVerifiedPurchase = false;
    let effectiveOrderId = orderId;
    if (effectiveOrderId) {
      const order = await Order.findOne({
        _id: effectiveOrderId,
        userId,
        "items.productId": resolvedProductId,
        status: { $in: ["delivered", "completed"] },
      });

      if (order) {
        isVerifiedPurchase = true;
      }
    } else {
      // Check if user has purchased this product in any order
      const purchaseOrder = await Order.findOne({
        userId,
        "items.productId": resolvedProductId,
        status: { $in: ["delivered", "completed"] },
      });

      if (purchaseOrder) {
        isVerifiedPurchase = true;
        effectiveOrderId = purchaseOrder._id;
      }
    }

    // 4. Create review
    const review = new Review({
      productId: resolvedProductId,
      userId,
      orderId: effectiveOrderId || null,
      rating,
      title,
      comment,
      images: images || [],
      variant: variant || {},
      isVerifiedPurchase,
      status: "pending", // Requires admin approval
    });

    await review.save();

    // 5. Populate user details
    await review.populate("userId", "name email");

    res.status(201).json({
      success: true,
      message: "Review submitted successfully. It will be visible after admin approval.",
      data: {
        review: {
          id: review._id,
          productId: review.productId,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          images: review.images,
          isVerifiedPurchase: review.isVerifiedPurchase,
          status: review.status,
          createdAt: review.createdAt,
          user: {
            name: review.userId.name,
            email: review.userId.email,
          },
        },
      },
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

/**
 * @desc    Get reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      rating,
      sortBy = "createdAt",
      sortOrder = "desc",
      verified = false,
    } = req.query;

    const resolvedProductId = await resolveProductId(productId);

    if (!resolvedProductId) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Build filter
    const filter = {
      productId: resolvedProductId,
      status: "approved", // Only show approved reviews
    };

    if (rating) {
      filter.rating = parseInt(rating);
    }

    if (verified === "true") {
      filter.isVerifiedPurchase = true;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get reviews
    const reviews = await Review.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name")
      .lean();

    // Get total count
    const totalReviews = await Review.countDocuments(filter);

    // Calculate rating distribution
    const ratingDistribution = await Review.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(resolvedProductId),
          status: "approved",
        },
      },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    // Format distribution
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingDistribution.forEach((item) => {
      distribution[item._id] = item.count;
    });

    // Calculate average rating
    const totalRatings = Object.values(distribution).reduce((a, b) => a + b, 0);
    const averageRating =
      totalRatings > 0
        ? (
          Object.entries(distribution).reduce(
            (sum, [rating, count]) => sum + rating * count,
            0
          ) / totalRatings
        ).toFixed(1)
        : 0;

    // Format reviews for response
    const formattedReviews = reviews.map((review) => ({
      id: review._id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      isVerifiedPurchase: review.isVerifiedPurchase,
      helpfulVotes: review.helpfulVotes,
      variant: review.variant,
      createdAt: review.createdAt,
      user: {
        name: review.userId?.name || "Anonymous",
      },
      adminResponse: review.adminResponse,
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        summary: {
          averageRating: parseFloat(averageRating),
          totalReviews,
          ratingDistribution: distribution,
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          hasMore: skip + formattedReviews.length < totalReviews,
        },
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

/**
 * @desc    Get user's reviews
 * @route   GET /api/reviews/user
 * @access  Private
 */
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("productId", "title slug media")
      .lean();

    const totalReviews = await Review.countDocuments({ userId });

    const formattedReviews = reviews.map((review) => ({
      id: review._id,
      product: {
        id: review.productId?._id,
        title: review.productId?.title,
        slug: review.productId?.slug,
        image: review.productId?.media?.[0]?.url,
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      isVerifiedPurchase: review.isVerifiedPurchase,
      status: review.status,
      helpfulVotes: review.helpfulVotes,
      createdAt: review.createdAt,
      adminResponse: review.adminResponse,
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          hasMore: skip + formattedReviews.length < totalReviews,
        },
      },
    });
  } catch (error) {
    console.error("Get user reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user reviews",
      error: error.message,
    });
  }
};

/**
 * @desc    Update a review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
exports.updateReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { rating, title, comment, images, variant } = req.body;

    const review = await Review.findOne({ _id: id, userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to update it",
      });
    }

    // Update allowed fields
    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;
    if (variant !== undefined) review.variant = variant;

    // Reset status to pending after edit
    review.status = "pending";

    await review.save();

    await review.populate("userId", "name email");

    res.json({
      success: true,
      message: "Review updated successfully. It will be re-reviewed by admin.",
      data: {
        review: {
          id: review._id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          images: review.images,
          variant: review.variant,
          status: review.status,
          updatedAt: review.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
exports.deleteReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const review = await Review.findOne({ _id: id, userId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found or you don't have permission to delete it",
      });
    }

    await review.deleteOne();

    // Recalculate product rating
    if (review.productId && mongoose.Types.ObjectId.isValid(review.productId)) {
      const { averageRating, reviewCount } =
        await Review.calculateProductRating(review.productId);

      await Product.findByIdAndUpdate(review.productId, {
        averageRating,
        reviewCount,
      });
    }

    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

/**
 * @desc    Mark review as helpful
 * @route   PATCH /api/reviews/:id/helpful
 * @access  Private
 */
exports.markReviewHelpful = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if already marked as helpful
    if (review.helpfulBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You have already marked this review as helpful",
      });
    }

    review.markAsHelpful(userId);
    await review.save();

    res.json({
      success: true,
      message: "Review marked as helpful",
      data: {
        helpfulVotes: review.helpfulVotes,
      },
    });
  } catch (error) {
    console.error("Mark review helpful error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark review as helpful",
      error: error.message,
    });
  }
};

/**
 * @desc    Remove helpful mark from review
 * @route   DELETE /api/reviews/:id/helpful
 * @access  Private
 */
exports.removeReviewHelpful = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if not marked as helpful
    if (!review.helpfulBy.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You haven't marked this review as helpful",
      });
    }

    review.removeHelpful(userId);
    await review.save();

    res.json({
      success: true,
      message: "Helpful mark removed",
      data: {
        helpfulVotes: review.helpfulVotes,
      },
    });
  } catch (error) {
    console.error("Remove review helpful error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove helpful mark",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all reviews (Admin)
 * @route   GET /api/reviews/admin/all
 * @access  Private (Admin)
 */
exports.getAllReviews = async (req, res) => {
  try {
    const {
      status,
      rating,
      verified,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    // Build filter
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (rating) {
      filter.rating = parseInt(rating);
    }

    if (verified === "true") {
      filter.isVerifiedPurchase = true;
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, "i") },
        { comment: new RegExp(search, "i") },
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    // Get reviews
    const reviews = await Review.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email")
      .populate("productId", "title slug")
      .lean();

    // Get total count
    const totalReviews = await Review.countDocuments(filter);

    // Format reviews for response
    const formattedReviews = reviews.map((review) => ({
      id: review._id,
      product: {
        id: review.productId?._id,
        title: review.productId?.title,
        slug: review.productId?.slug,
      },
      user: {
        id: review.userId?._id,
        name: review.userId?.name,
        email: review.userId?.email,
      },
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images,
      isVerifiedPurchase: review.isVerifiedPurchase,
      status: review.status,
      helpfulVotes: review.helpfulVotes,
      createdAt: review.createdAt,
      moderatedAt: review.moderatedAt,
      rejectionReason: review.rejectionReason,
    }));

    res.json({
      success: true,
      data: {
        reviews: formattedReviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalReviews / parseInt(limit)),
          totalReviews,
          hasMore: skip + formattedReviews.length < totalReviews,
        },
      },
    });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

/**
 * @desc    Approve review (Admin)
 * @route   PATCH /api/reviews/:id/approve
 * @access  Private (Admin)
 */
exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Review is already approved",
      });
    }

    review.status = "approved";
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();
    review.rejectionReason = undefined;

    await review.save();

    // Recalculate product rating
    const { averageRating, reviewCount } =
      await Review.calculateProductRating(review.productId);

    await Product.findByIdAndUpdate(review.productId, {
      averageRating,
      reviewCount,
    });

    res.json({
      success: true,
      message: "Review approved successfully",
      data: {
        review: {
          id: review._id,
          status: review.status,
          moderatedAt: review.moderatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Approve review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve review",
      error: error.message,
    });
  }
};

/**
 * @desc    Reject review (Admin)
 * @route   PATCH /api/reviews/:id/reject
 * @access  Private (Admin)
 */
exports.rejectReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.status = "rejected";
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();
    review.rejectionReason = reason || "Does not meet review guidelines";

    await review.save();

    res.json({
      success: true,
      message: "Review rejected successfully",
      data: {
        review: {
          id: review._id,
          status: review.status,
          rejectionReason: review.rejectionReason,
          moderatedAt: review.moderatedAt,
        },
      },
    });
  } catch (error) {
    console.error("Reject review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject review",
      error: error.message,
    });
  }
};

/**
 * @desc    Add admin response to review (Admin)
 * @route   PATCH /api/reviews/:id/respond
 * @access  Private (Admin)
 */
exports.respondToReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.user._id;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.adminResponse = {
      message,
      respondedBy: adminId,
      respondedAt: new Date(),
    };

    await review.save();

    await review.populate("adminResponse.respondedBy", "name");

    res.json({
      success: true,
      message: "Response added successfully",
      data: {
        adminResponse: {
          message: review.adminResponse.message,
          respondedBy: review.adminResponse.respondedBy.name,
          respondedAt: review.adminResponse.respondedAt,
        },
      },
    });
  } catch (error) {
    console.error("Respond to review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add response",
      error: error.message,
    });
  }
};

/**
 * @desc    Check if user can review a product
 * @route   GET /api/reviews/can-review/:productId
 * @access  Private
 */
exports.canReviewProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.params;

    const resolvedProductId = await resolveProductId(productId);

    if (!resolvedProductId) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      userId,
      productId: resolvedProductId,
    });

    if (existingReview) {
      return res.json({
        success: true,
        data: {
          canReview: false,
          reason: "You have already reviewed this product",
          existingReview: {
            id: existingReview._id,
            rating: existingReview.rating,
            status: existingReview.status,
          },
        },
      });
    }

    // Check if user has purchased this product
    const purchaseOrder = await Order.findOne({
      userId,
      "items.productId": resolvedProductId,
      status: { $in: ["delivered", "completed"] },
    });

    if (!purchaseOrder) {
      return res.json({
        success: true,
        data: {
          canReview: true,
          hasPurchased: false,
          message: "You can review this product, but it won't be marked as verified purchase",
        },
      });
    }

    res.json({
      success: true,
      data: {
        canReview: true,
        hasPurchased: true,
        orderId: purchaseOrder._id,
        message: "You can write a verified review for this product",
      },
    });
  } catch (error) {
    console.error("Can review product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check review eligibility",
      error: error.message,
    });
  }
};
