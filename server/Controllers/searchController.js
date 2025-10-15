const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Product = require("../models/Product");
const Category = require("../models/Category");
const Order = require("../models/Order");
const User = require("../models/User");
const CustomerProfile = require("../models/CustomerProfile");

// =========================================================
// Helper utilities
// =========================================================

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const formatProduct = (product, includeScore = false) => {
  const primaryMedia = product.media?.find((media) => media.isPrimary) || product.media?.[0];
  const imageUrl = primaryMedia?.url || "";

  const formatted = {
    id: product.slug,
    title: product.title,
    description: product.description,
    category: product.category,
    price: product.basePrice,
    averageRating: product.averageRating,
    reviewCount: product.reviewCount,
    totalStock: product.totalStock,
    isAvailable: product.isActive && product.totalStock > 0,
    tags: product.tags || [],
    imageUrl,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };

  if (includeScore && product.score !== undefined) {
    formatted.score = product.score;
  }

  return formatted;
};

// =========================================================
// Public search endpoints
// =========================================================

exports.searchProducts = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      q = "",
      category,
      minPrice,
      maxPrice,
      minRating,
      tags,
      inStock,
      sortBy = "relevance",
      sortOrder = "desc",
      page = 1,
      limit = 12,
    } = req.query;

    const numericLimit = Math.min(parseInt(limit, 10) || 12, 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = { isActive: true };
    let useTextScore = false;

    if (category) {
      filter.category = category.toLowerCase().trim();
    }

    if (typeof inStock === "string") {
      const wantsInStock = inStock.toLowerCase() === "true";
      if (wantsInStock) {
        filter.totalStock = { $gt: 0 };
      }
    }

    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) {
        filter.basePrice.$gte = Number(minPrice);
      }
      if (maxPrice) {
        filter.basePrice.$lte = Number(maxPrice);
      }
    }

    if (minRating) {
      filter.averageRating = { $gte: Number(minRating) };
    }

    if (tags) {
      const tagList = tags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);
      if (tagList.length) {
        filter.tags = { $in: tagList };
      }
    }

    const trimmedQuery = q.trim();
    const hasSearchTerm = trimmedQuery.length > 0;
    const projection = {};
    const sortOptions = {};

    if (hasSearchTerm) {
      if (trimmedQuery.length >= 2) {
        filter.$text = { $search: trimmedQuery };
        projection.score = { $meta: "textScore" };
        sortOptions.score = { $meta: "textScore" };
        useTextScore = true;
      } else {
        const regex = new RegExp(escapeRegex(trimmedQuery), "i");
        filter.$or = [{ title: regex }, { description: regex }, { tags: regex }];
      }
    }

    switch (sortBy) {
      case "price":
        sortOptions.basePrice = sortOrder === "asc" ? 1 : -1;
        break;
      case "newest":
        sortOptions.createdAt = sortOrder === "asc" ? 1 : -1;
        break;
      case "rating":
        sortOptions.averageRating = sortOrder === "asc" ? 1 : -1;
        sortOptions.reviewCount = -1;
        break;
      case "relevance":
      default:
        if (!useTextScore) {
          sortOptions.createdAt = -1;
        }
        break;
    }

    if (!Object.keys(sortOptions).length) {
      sortOptions.createdAt = -1;
    }

    const [products, total, categoryBuckets, priceRange, ratingBuckets] = await Promise.all([
      Product.find(filter, projection)
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            minPrice: { $min: "$basePrice" },
            maxPrice: { $max: "$basePrice" },
          },
        },
      ]),
      Product.aggregate([
        { $match: filter },
        {
          $bucket: {
            groupBy: "$averageRating",
            boundaries: [0, 1, 2, 3, 4, 5],
            default: "5+",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    const formattedProducts = products.map((product) =>
      formatProduct(product, useTextScore)
    );

    const facets = {
      categories: categoryBuckets.map((bucket) => ({
        category: bucket._id,
        count: bucket.count,
      })),
      priceRange:
        priceRange[0] && priceRange[0].minPrice !== undefined
          ? {
            min: priceRange[0].minPrice,
            max: priceRange[0].maxPrice,
          }
          : null,
      ratingDistribution: ratingBuckets.map((bucket) => ({
        bucket: bucket._id,
        count: bucket.count,
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      pagination: buildPagination(numericPage, numericLimit, total),
      data: {
        query: trimmedQuery,
        results: formattedProducts,
        facets,
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching products",
      error: error.message,
    });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { q = "", limit = 8 } = req.query;
    const trimmedQuery = q.trim();
    const numericLimit = Math.min(parseInt(limit, 10) || 8, 20);

    const regex = trimmedQuery.length
      ? new RegExp(escapeRegex(trimmedQuery), "i")
      : null;

    const productPromise = Product.find(
      regex
        ? {
          isActive: true,
          $or: [{ title: regex }, { description: regex }, { tags: regex }],
        }
        : { isActive: true }
    )
      .sort(regex ? { createdAt: -1 } : { reviewCount: -1 })
      .limit(numericLimit)
      .select("title slug category tags reviewCount averageRating")
      .lean();

    const categoryPromise = Category.find(
      regex
        ? {
          isActive: true,
          $or: [{ name: regex }, { slug: regex }, { description: regex }],
        }
        : { isActive: true }
    )
      .sort({ displayOrder: 1 })
      .limit(Math.max(5, Math.ceil(numericLimit / 2)))
      .select("name slug description")
      .lean();

    const tagsPromise = Product.aggregate([
      { $match: regex ? { tags: { $regex: regex } } : { tags: { $exists: true, $ne: [] } } },
      { $unwind: "$tags" },
      { $match: regex ? { tags: { $regex: regex } } : {} },
      {
        $group: {
          _id: "$tags",
          popularity: { $sum: 1 },
        },
      },
      { $sort: { popularity: -1 } },
      { $limit: Math.max(5, numericLimit) },
    ]);

    const [products, categories, tagBuckets] = await Promise.all([
      productPromise,
      categoryPromise,
      tagsPromise,
    ]);

    const suggestions = [];

    products.forEach((product) => {
      suggestions.push({
        type: "product",
        value: product.title,
        slug: product.slug,
        category: product.category,
        highlights: {
          averageRating: product.averageRating,
          reviewCount: product.reviewCount,
        },
      });
    });

    categories.forEach((category) => {
      suggestions.push({
        type: "category",
        value: category.name,
        slug: category.slug,
        description: category.description,
      });
    });

    tagBuckets.forEach((tag) => {
      suggestions.push({
        type: "tag",
        value: tag._id,
        popularity: tag.popularity,
      });
    });

    const limitedSuggestions = suggestions.slice(0, numericLimit);

    return res.status(200).json({
      success: true,
      message: "Search suggestions fetched successfully",
      data: {
        query: trimmedQuery,
        suggestions: limitedSuggestions,
      },
    });
  } catch (error) {
    console.error("Error fetching search suggestions:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching search suggestions",
      error: error.message,
    });
  }
};

// =========================================================
// Admin search endpoints
// =========================================================

exports.searchOrders = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      q = "",
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
      sortBy = "placedAt",
      sortOrder = "desc",
    } = req.query;

    const numericLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const filter = {};
    const orConditions = [];
    const trimmedQuery = q.trim();

    if (trimmedQuery) {
      const regex = new RegExp(escapeRegex(trimmedQuery), "i");

      orConditions.push(
        { orderNumber: regex },
        { "shipping.recipient": regex },
        { "shipping.phone": regex },
        { "customer.email": regex },
        { "customer.phone": regex }
      );

      const matchingUsers = await User.find({
        $or: [{ fullName: regex }, { email: regex }, { mobileNumber: regex }],
      })
        .select("_id")
        .lean();

      if (matchingUsers.length) {
        orConditions.push({ userId: { $in: matchingUsers.map((user) => user._id) } });
      }
    }

    if (orConditions.length) {
      filter.$or = orConditions;
    }

    if (status) {
      filter.status = status;
    }

    if (fromDate || toDate) {
      filter.placedAt = {};
      if (fromDate) {
        filter.placedAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.placedAt.$lte = new Date(toDate);
      }
    }

    const sortOptions = {};
    switch (sortBy) {
      case "grandTotal":
        sortOptions["pricing.grandTotal"] = sortOrder === "asc" ? 1 : -1;
        break;
      case "status":
        sortOptions.status = sortOrder === "asc" ? 1 : -1;
        break;
      case "placedAt":
      default:
        sortOptions.placedAt = sortOrder === "asc" ? 1 : -1;
        break;
    }

    const [orders, total, statusBuckets] = await Promise.all([
      Order.find(filter)
        .populate("userId", "fullName email mobileNumber role")
        .sort(sortOptions)
        .skip(skip)
        .limit(numericLimit)
        .lean(),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$pricing.grandTotal" },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    const formattedOrders = orders.map((order) => ({
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      placedAt: order.placedAt,
      grandTotal: order.pricing?.grandTotal || 0,
      discount: order.pricing?.discount || 0,
      paymentStatus: order.payment?.status,
      paymentMethod: order.payment?.method,
      customer: {
        id: order.userId?._id,
        name: order.userId?.fullName || order.customer?.name,
        email: order.userId?.email || order.customer?.email,
        phone: order.userId?.mobileNumber || order.customer?.phone,
      },
      shippingRecipient: order.shipping?.recipient,
      shippingCity: order.shipping?.city,
      itemsCount: order.items?.length || 0,
    }));

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully",
      pagination: buildPagination(numericPage, numericLimit, total),
      data: {
        query: trimmedQuery,
        results: formattedOrders,
        stats: statusBuckets.map((bucket) => ({
          status: bucket._id,
          count: bucket.count,
          totalValue: bucket.totalValue,
        })),
      },
    });
  } catch (error) {
    console.error("Error searching orders:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching orders",
      error: error.message,
    });
  }
};

exports.searchCustomers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      q = "",
      membershipTier,
      minOrders,
      maxOrders,
      page = 1,
      limit = 20,
      sortBy = "recentActivity",
      sortOrder = "desc",
    } = req.query;

    const numericLimit = Math.min(parseInt(limit, 10) || 20, 100);
    const numericPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (numericPage - 1) * numericLimit;

    const pipeline = [];

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" }
    );

    pipeline.push({
      $match: {
        "user.isActive": true,
      },
    });

    const matchConditions = [];
    const trimmedQuery = q.trim();

    if (trimmedQuery) {
      const regex = new RegExp(escapeRegex(trimmedQuery), "i");
      matchConditions.push(
        { "user.fullName": regex },
        { "user.email": regex },
        { "user.mobileNumber": regex }
      );
    }

    if (membershipTier) {
      matchConditions.push({ "membership.tier": membershipTier });
    }

    if (minOrders || maxOrders) {
      const ordersFilter = {};
      if (minOrders) {
        ordersFilter.$gte = Number(minOrders);
      }
      if (maxOrders) {
        ordersFilter.$lte = Number(maxOrders);
      }
      matchConditions.push({ "stats.totalOrders": ordersFilter });
    }

    if (matchConditions.length) {
      pipeline.push({ $match: { $and: matchConditions.map((condition) => condition) } });
    }

    const sortOptions = {};
    switch (sortBy) {
      case "totalSpent":
        sortOptions["stats.totalSpent"] = sortOrder === "asc" ? 1 : -1;
        break;
      case "orders":
        sortOptions["stats.totalOrders"] = sortOrder === "asc" ? 1 : -1;
        break;
      case "recentActivity":
      default:
        sortOptions.updatedAt = sortOrder === "asc" ? 1 : -1;
        break;
    }

    pipeline.push({ $sort: sortOptions });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: numericLimit });

    pipeline.push({
      $project: {
        _id: 1,
        userId: 1,
        membership: 1,
        stats: 1,
        rewards: 1,
        updatedAt: 1,
        createdAt: 1,
        user: {
          _id: "$user._id",
          fullName: "$user.fullName",
          email: "$user.email",
          mobileNumber: "$user.mobileNumber",
          role: "$user.role",
          isVerified: "$user.isVerified",
          createdAt: "$user.createdAt",
        },
      },
    });

    const countPipeline = pipeline
      .filter((stage) => !stage.$skip && !stage.$limit && !stage.$project && !stage.$sort)
      .map((stage) => ({ ...stage }));

    countPipeline.push({
      $count: "total",
    });

    const [customers, totalCountResult, tierBuckets] = await Promise.all([
      CustomerProfile.aggregate(pipeline),
      CustomerProfile.aggregate(countPipeline),
      CustomerProfile.aggregate([
        {
          $group: {
            _id: "$membership.tier",
            count: { $sum: 1 },
            totalSpent: { $sum: "$stats.totalSpent" },
          },
        },
        { $sort: { totalSpent: -1 } },
      ]),
    ]);

    const total = totalCountResult[0]?.total || 0;

    const formattedCustomers = customers.map((customer) => ({
      id: customer._id,
      userId: customer.userId,
      name: customer.user.fullName,
      email: customer.user.email,
      phone: customer.user.mobileNumber,
      membershipTier: customer.membership?.tier,
      totalOrders: customer.stats?.totalOrders || 0,
      totalSpent: customer.stats?.totalSpent || 0,
      rewardPoints: customer.rewards?.rewardPoints || 0,
      walletBalance: customer.rewards?.walletBalance || 0,
      lastUpdated: customer.updatedAt,
      userCreatedAt: customer.user.createdAt,
      isVerified: customer.user.isVerified,
    }));

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      pagination: buildPagination(numericPage, numericLimit, total),
      data: {
        query: trimmedQuery,
        results: formattedCustomers,
        tierDistribution: tierBuckets.map((bucket) => ({
          tier: bucket._id,
          count: bucket.count,
          totalSpent: bucket.totalSpent,
        })),
      },
    });
  } catch (error) {
    console.error("Error searching customers:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching customers",
      error: error.message,
    });
  }
};
