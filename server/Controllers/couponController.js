const mongoose = require("mongoose");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const CustomerProfile = require("../models/CustomerProfile");
const { validationResult } = require("express-validator");

// =============================================
// USER COUPON CONTROLLERS
// =============================================

/**
 * @desc    Validate and apply coupon code
 * @route   POST /api/coupons/validate
 * @access  Private (Customer)
 */
exports.validateCoupon = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { code, orderAmount, items } = req.body;
    const userId = req.user._id;

    // Find coupon by code (case-insensitive)
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // Check basic validity (active, date range, total usage)
    const validityCheck = coupon.isValid();
    if (!validityCheck.valid) {
      return res.status(400).json({
        success: false,
        message: validityCheck.reason,
      });
    }

    // Get customer profile for eligibility checks
    const customerProfile = await CustomerProfile.findOne({ userId });

    // Check if user can use this coupon
    const userEligibility = coupon.canUserUse(
      userId,
      orderAmount,
      customerProfile
    );
    if (!userEligibility.valid) {
      return res.status(400).json({
        success: false,
        message: userEligibility.reason,
      });
    }

    // Check product applicability
    const hasProductApplicabilityRules =
      (Array.isArray(coupon.applicableProducts) &&
        coupon.applicableProducts.length > 0) ||
      (Array.isArray(coupon.excludedProducts) &&
        coupon.excludedProducts.length > 0) ||
      (Array.isArray(coupon.applicableCategories) &&
        coupon.applicableCategories.length > 0);

    if (hasProductApplicabilityRules) {
      const applicabilityCheck = await checkProductApplicability(coupon, items);
      if (!applicabilityCheck.valid) {
        return res.status(400).json({
          success: false,
          message: applicabilityCheck.reason,
        });
      }
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(orderAmount);

    res.status(200).json({
      success: true,
      message: "Coupon is valid",
      data: {
        couponId: coupon._id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountApplied: discount,
        finalAmount: Math.max(0, orderAmount - discount),
        freeShipping: coupon.discountType === "freeShipping",
      },
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating coupon",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all available coupons for user
 * @route   GET /api/coupons/available
 * @access  Private (Customer)
 */
exports.getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Get customer profile
    const customerProfile = await CustomerProfile.findOne({ userId });

    // Find all active coupons within validity period
    const coupons = await Coupon.find({
      isActive: true,
      "validity.startDate": { $lte: now },
      "validity.endDate": { $gte: now },
    })
      .select("-createdBy")
      .sort({ discountValue: -1 });

    // Filter coupons based on user eligibility
    const availableCoupons = [];
    for (const coupon of coupons) {
      // Check if coupon has reached total usage limit
      if (
        coupon.usageLimit?.total &&
        coupon.usageCount >= coupon.usageLimit.total
      ) {
        continue;
      }

      // Check per-user usage limit
      const userUsageCount = (coupon.usedBy ?? []).filter((u) =>
        u.userId?.toString?.() === userId.toString()
      ).length;
      if (
        coupon.usageLimit?.perUser !== undefined &&
        userUsageCount >= coupon.usageLimit.perUser
      ) {
        continue;
      }

      // Check new users only
      if (
        coupon.eligibility?.newUsersOnly &&
        customerProfile?.stats?.totalOrders > 0
      ) {
        continue;
      }

      // Check membership tier
      if (
        (coupon.eligibility?.membershipTiers?.length ?? 0) > 0 &&
        !coupon.eligibility.membershipTiers.includes(
          customerProfile?.membership?.tier
        )
      ) {
        continue;
      }

      // Check specific users
      if (
        (coupon.eligibility?.specificUsers?.length ?? 0) > 0 &&
        !coupon.eligibility.specificUsers.some(
          (id) => id.toString() === userId.toString()
        )
      ) {
        continue;
      }

      const validity = {
        startDate: coupon.validity?.startDate ?? null,
        endDate: coupon.validity?.endDate ?? null,
      };

      const isExpired = validity.endDate ? now > validity.endDate : false;
      const isCurrentlyActive =
        coupon.isActive !== false &&
        !isExpired &&
        (!validity.startDate || now >= validity.startDate);

      availableCoupons.push({
        _id: coupon._id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscount: coupon.maxDiscount,
        minOrderAmount: coupon.minOrderAmount,
        validFrom: validity.startDate,
        validUntil: validity.endDate,
        campaignType: coupon.campaignType,
        isActive: coupon.isActive !== false,
        isCurrentlyActive,
        isExpired,
        isEnabled: coupon.isActive !== false,
        usageRemaining:
          coupon.usageLimit?.total !== null &&
            coupon.usageLimit?.total !== undefined
            ? coupon.usageLimit.total - coupon.usageCount
            : null,
        userUsageRemaining:
          coupon.usageLimit?.perUser !== undefined
            ? coupon.usageLimit.perUser - userUsageCount
            : null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Available coupons retrieved successfully",
      count: availableCoupons.length,
      data: availableCoupons,
    });
  } catch (error) {
    console.error("Error fetching available coupons:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching coupons",
      error: error.message,
    });
  }
};

/**
 * @desc    Get user's coupon usage history
 * @route   GET /api/coupons/my-usage
 * @access  Private (Customer)
 */
exports.getUserCouponUsage = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all coupons used by this user
    const coupons = await Coupon.find({
      "usedBy.userId": userId,
    })
      .select("code description discountType discountValue usedBy")
      .sort({ updatedAt: -1 });

    // Extract user's usage from each coupon
    const usageHistory = [];
    for (const coupon of coupons) {
      const userUsages = coupon.usedBy.filter(
        (u) => u.userId.toString() === userId.toString()
      );

      for (const usage of userUsages) {
        usageHistory.push({
          couponCode: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountApplied: usage.discountApplied,
          usedAt: usage.usedAt,
          orderId: usage.orderId,
        });
      }
    }

    // Sort by most recent
    usageHistory.sort((a, b) => b.usedAt - a.usedAt);

    res.status(200).json({
      success: true,
      message: "Coupon usage history retrieved successfully",
      count: usageHistory.length,
      data: usageHistory,
    });
  } catch (error) {
    console.error("Error fetching coupon usage:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching usage history",
      error: error.message,
    });
  }
};

/**
 * @desc    Auto-apply best coupon for cart
 * @route   POST /api/coupons/auto-apply
 * @access  Private (Customer)
 */
exports.autoApplyBestCoupon = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { orderAmount, items } = req.body;
    const userId = req.user._id;
    const now = new Date();

    // Get customer profile
    const customerProfile = await CustomerProfile.findOne({ userId });

    // Find all active coupons
    const coupons = await Coupon.find({
      isActive: true,
      "validity.startDate": { $lte: now },
      "validity.endDate": { $gte: now },
      minOrderAmount: { $lte: orderAmount },
    }).sort({ discountValue: -1 });

    let bestCoupon = null;
    let maxDiscount = 0;

    // Evaluate each coupon
    for (const coupon of coupons) {
      // Check validity and user eligibility
      const validityCheck = coupon.isValid();
      if (!validityCheck.valid) continue;

      const userEligibility = coupon.canUserUse(
        userId,
        orderAmount,
        customerProfile
      );
      if (!userEligibility.valid) continue;

      // Check product applicability
      const hasProductApplicabilityRules =
        (Array.isArray(coupon.applicableProducts) &&
          coupon.applicableProducts.length > 0) ||
        (Array.isArray(coupon.excludedProducts) &&
          coupon.excludedProducts.length > 0) ||
        (Array.isArray(coupon.applicableCategories) &&
          coupon.applicableCategories.length > 0);

      if (hasProductApplicabilityRules) {
        const applicabilityCheck = await checkProductApplicability(
          coupon,
          items
        );
        if (!applicabilityCheck.valid) continue;
      }

      // Calculate discount
      const discount = coupon.calculateDiscount(orderAmount);

      if (discount > maxDiscount) {
        maxDiscount = discount;
        bestCoupon = coupon;
      }
    }

    if (!bestCoupon) {
      return res.status(404).json({
        success: false,
        message: "No applicable coupons found for your cart",
      });
    }

    res.status(200).json({
      success: true,
      message: "Best coupon found and applied",
      data: {
        couponId: bestCoupon._id,
        code: bestCoupon.code,
        description: bestCoupon.description,
        discountType: bestCoupon.discountType,
        discountValue: bestCoupon.discountValue,
        discountApplied: maxDiscount,
        finalAmount: Math.max(0, orderAmount - maxDiscount),
        freeShipping: bestCoupon.discountType === "freeShipping",
        savings: maxDiscount,
      },
    });
  } catch (error) {
    console.error("Error auto-applying coupon:", error);
    res.status(500).json({
      success: false,
      message: "Server error while finding best coupon",
      error: error.message,
    });
  }
};

// =============================================
// ADMIN COUPON CONTROLLERS
// =============================================

/**
 * @desc    Create new coupon
 * @route   POST /api/coupons/admin/create
 * @access  Private (Admin)
 */
exports.createCoupon = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const couponData = req.body;
    couponData.createdBy = req.user._id;

    // Check if coupon code already exists
    const existingCoupon = await Coupon.findOne({
      code: couponData.code.toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    // Validate discount value based on type
    if (
      couponData.discountType === "percentage" &&
      (couponData.discountValue < 0 || couponData.discountValue > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount must be between 0 and 100",
      });
    }

    // Validate dates
    if (new Date(couponData.validity.startDate) >= new Date(couponData.validity.endDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating coupon",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all coupons (admin view)
 * @route   GET /api/coupons/admin/all
 * @access  Private (Admin)
 */
exports.getAllCoupons = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      discountType,
      campaignType,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};

    // Filter by status
    if (status === "active") {
      query.isActive = true;
      query["validity.endDate"] = { $gte: new Date() };
    } else if (status === "inactive") {
      query.isActive = false;
    } else if (status === "expired") {
      query["validity.endDate"] = { $lt: new Date() };
    }

    // Filter by discount type
    if (discountType) {
      query.discountType = discountType;
    }

    // Filter by campaign type
    if (campaignType) {
      query.campaignType = campaignType;
    }

    // Search by code or description
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortOptions = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const coupons = await Coupon.find(query)
      .populate("createdBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments(query);

    // Calculate statistics for each coupon
    const couponsWithStats = coupons.map((coupon) => {
      const now = new Date();
      const isExpired = now > coupon.validity.endDate;
      const isActive = coupon.isActive && !isExpired;
      const usagePercentage =
        coupon.usageLimit.total !== null
          ? (coupon.usageCount / coupon.usageLimit.total) * 100
          : 0;

      return {
        ...coupon.toObject(),
        isExpired,
        isCurrentlyActive: isActive,
        usagePercentage: usagePercentage.toFixed(2),
        remainingUsage:
          coupon.usageLimit.total !== null
            ? coupon.usageLimit.total - coupon.usageCount
            : "Unlimited",
      };
    });

    res.status(200).json({
      success: true,
      message: "Coupons retrieved successfully",
      count: coupons.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: couponsWithStats,
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching coupons",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single coupon details
 * @route   GET /api/coupons/admin/:id
 * @access  Private (Admin)
 */
exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("applicableProducts", "title images")
      .populate("excludedProducts", "title images")
      .populate("eligibility.specificUsers", "name email")
      .populate({
        path: "usedBy.userId",
        select: "name email",
      })
      .populate({
        path: "usedBy.orderId",
        select: "orderNumber pricing.grandTotal",
      });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Calculate analytics
    const totalDiscountGiven = coupon.usedBy.reduce(
      (sum, usage) => sum + (usage.discountApplied || 0),
      0
    );

    const analytics = {
      totalUsage: coupon.usageCount,
      totalDiscountGiven: totalDiscountGiven.toFixed(2),
      averageDiscountPerUse:
        coupon.usageCount > 0
          ? (totalDiscountGiven / coupon.usageCount).toFixed(2)
          : 0,
      uniqueUsers: new Set(coupon.usedBy.map((u) => u.userId.toString())).size,
    };

    res.status(200).json({
      success: true,
      message: "Coupon details retrieved successfully",
      data: {
        ...coupon.toObject(),
        analytics,
      },
    });
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching coupon",
      error: error.message,
    });
  }
};

/**
 * @desc    Update coupon
 * @route   PUT /api/coupons/admin/:id
 * @access  Private (Admin)
 */
exports.updateCoupon = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const updates = req.body;

    // Don't allow changing code if already used
    if (updates.code && coupon.usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot change code for a coupon that has been used",
      });
    }

    // If code is being changed, check uniqueness
    if (updates.code && updates.code !== coupon.code) {
      const existingCoupon = await Coupon.findOne({
        code: updates.code.toUpperCase(),
        _id: { $ne: coupon._id },
      });

      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: "Coupon code already exists",
        });
      }
    }

    // Validate discount value if being updated
    if (updates.discountType === "percentage" && updates.discountValue) {
      if (updates.discountValue < 0 || updates.discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: "Percentage discount must be between 0 and 100",
        });
      }
    }

    // Validate dates if being updated
    if (updates.validity) {
      const startDate = updates.validity.startDate || coupon.validity.startDate;
      const endDate = updates.validity.endDate || coupon.validity.endDate;

      if (new Date(startDate) >= new Date(endDate)) {
        return res.status(400).json({
          success: false,
          message: "End date must be after start date",
        });
      }
    }

    // Update coupon
    Object.assign(coupon, updates);
    await coupon.save();

    res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: coupon,
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating coupon",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete coupon
 * @route   DELETE /api/coupons/admin/:id
 * @access  Private (Admin)
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Don't allow deleting coupons that have been used
    if (coupon.usageCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a coupon that has been used. Consider deactivating it instead.",
      });
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting coupon",
      error: error.message,
    });
  }
};

/**
 * @desc    Toggle coupon active status
 * @route   PATCH /api/coupons/admin/:id/toggle-status
 * @access  Private (Admin)
 */
exports.toggleCouponStatus = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        code: coupon.code,
        isActive: coupon.isActive,
      },
    });
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while toggling status",
      error: error.message,
    });
  }
};

/**
 * @desc    Get coupon analytics
 * @route   GET /api/coupons/admin/analytics
 * @access  Private (Admin)
 */
exports.getCouponAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, campaignType } = req.query;

    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (campaignType) {
      query.campaignType = campaignType;
    }

    const coupons = await Coupon.find(query);

    // Calculate overall statistics
    const stats = {
      totalCoupons: coupons.length,
      activeCoupons: coupons.filter((c) => c.isActive).length,
      expiredCoupons: coupons.filter((c) => new Date() > c.validity.endDate)
        .length,
      totalUsage: coupons.reduce((sum, c) => sum + c.usageCount, 0),
      totalDiscountGiven: 0,
      averageDiscountPerCoupon: 0,
      byDiscountType: {
        percentage: 0,
        fixed: 0,
        freeShipping: 0,
      },
      byCampaignType: {},
      topPerformingCoupons: [],
    };

    // Calculate total discount given
    for (const coupon of coupons) {
      const discountGiven = coupon.usedBy.reduce(
        (sum, usage) => sum + (usage.discountApplied || 0),
        0
      );
      stats.totalDiscountGiven += discountGiven;

      // Count by discount type
      stats.byDiscountType[coupon.discountType]++;

      // Count by campaign type
      stats.byCampaignType[coupon.campaignType] =
        (stats.byCampaignType[coupon.campaignType] || 0) + 1;
    }

    stats.averageDiscountPerCoupon =
      coupons.length > 0
        ? (stats.totalDiscountGiven / coupons.length).toFixed(2)
        : 0;

    // Top performing coupons (by usage count)
    stats.topPerformingCoupons = coupons
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map((c) => ({
        code: c.code,
        usageCount: c.usageCount,
        discountType: c.discountType,
        discountValue: c.discountValue,
        totalDiscountGiven: c.usedBy
          .reduce((sum, usage) => sum + (usage.discountApplied || 0), 0)
          .toFixed(2),
      }));

    res.status(200).json({
      success: true,
      message: "Coupon analytics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching analytics",
      error: error.message,
    });
  }
};

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Check if coupon is applicable to cart items
 */
async function checkProductApplicability(coupon, items) {
  const Product = require("../models/Product");

  if (!Array.isArray(items) || items.length === 0) {
    return { valid: true };
  }

  const identifierSets = items.reduce(
    (acc, item) => {
      const raw = item?.productId;
      if (!raw) {
        return acc;
      }

      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (mongoose.Types.ObjectId.isValid(trimmed)) {
          acc.objectIds.add(trimmed);
        } else if (trimmed.length) {
          acc.slugs.add(trimmed.toLowerCase());
        }
      } else if (mongoose.Types.ObjectId.isValid(raw)) {
        acc.objectIds.add(raw.toString());
      }

      return acc;
    },
    { objectIds: new Set(), slugs: new Set() }
  );

  const productQuery = [];

  if (identifierSets.objectIds.size > 0) {
    productQuery.push({ _id: { $in: Array.from(identifierSets.objectIds) } });
  }

  if (identifierSets.slugs.size > 0) {
    productQuery.push({ slug: { $in: Array.from(identifierSets.slugs) } });
  }

  const products = productQuery.length
    ? await Product.find({ $or: productQuery }).select("slug category")
    : [];

  const productLookup = new Map();

  products.forEach((product) => {
    const id = product._id?.toString?.();
    if (id) {
      productLookup.set(id, product);
    }

    if (product.slug) {
      productLookup.set(product.slug.toLowerCase(), product);
    }
  });

  const resolveProduct = (identifier) => {
    if (!identifier) {
      return null;
    }

    if (productLookup.has(identifier)) {
      return productLookup.get(identifier);
    }

    if (typeof identifier === "string") {
      const trimmed = identifier.trim();

      if (productLookup.has(trimmed)) {
        return productLookup.get(trimmed);
      }

      const lower = trimmed.toLowerCase();
      return productLookup.get(lower) ?? null;
    }

    const idString = identifier.toString?.();
    return idString ? productLookup.get(idString) ?? null : null;
  };

  const applicableProductIds = (coupon.applicableProducts ?? [])
    .map((pid) => pid?.toString?.())
    .filter(Boolean);
  const excludedProductIds = (coupon.excludedProducts ?? [])
    .map((pid) => pid?.toString?.())
    .filter(Boolean);
  const applicableCategories = (coupon.applicableCategories ?? [])
    .map((category) => category?.toString?.().toLowerCase?.())
    .filter(Boolean);

  // If specific products are specified, check if any cart item matches
  const hasApplicableProductRules =
    Array.isArray(coupon.applicableProducts) &&
    coupon.applicableProducts.length > 0;
  const hasExcludedProductRules =
    Array.isArray(coupon.excludedProducts) &&
    coupon.excludedProducts.length > 0;
  const hasApplicableCategoryRules =
    Array.isArray(coupon.applicableCategories) &&
    coupon.applicableCategories.length > 0;

  if (hasApplicableProductRules) {
    const hasApplicableProduct = items.some((item) => {
      const product = resolveProduct(item.productId);

      if (!product) {
        return false;
      }

      return applicableProductIds.includes(product._id.toString());
    });

    if (!hasApplicableProduct) {
      return {
        valid: false,
        reason: "This coupon is not applicable to items in your cart",
      };
    }
  }

  // Check for excluded products
  if (hasExcludedProductRules) {
    const hasExcludedProduct = items.some((item) => {
      const product = resolveProduct(item.productId);

      if (!product) {
        return false;
      }

      return excludedProductIds.includes(product._id.toString());
    });

    if (hasExcludedProduct) {
      return {
        valid: false,
        reason: "Some items in your cart are excluded from this coupon",
      };
    }
  }

  // Check for applicable categories
  if (hasApplicableCategoryRules) {
    const hasApplicableCategory = items.some((item) => {
      const product = resolveProduct(item.productId);

      if (!product) {
        return false;
      }

      const categoryValue =
        product.categoryId?.toString?.() ?? product.category ?? null;

      if (!categoryValue) {
        return false;
      }

      return applicableCategories.includes(categoryValue.toLowerCase());
    });

    if (!hasApplicableCategory) {
      return {
        valid: false,
        reason: "This coupon is not applicable to the product categories in your cart",
      };
    }
  }

  return { valid: true };
}
