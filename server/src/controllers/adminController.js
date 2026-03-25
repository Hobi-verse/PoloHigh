const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const buildPagination = ({ page, limit, total }) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

/**
 * @desc    Get admin overview dashboard metrics
 * @route   GET /api/admin/overview
 * @access  Private/Admin
 */
exports.getOverview = async (req, res) => {
  try {
    const [
      totalProducts,
      activeProducts,
      totalCustomers,
      totalOrders,
      orderStatusBuckets,
      paymentStatusBuckets,
      revenueAgg,
      recentOrders,
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      User.countDocuments({ role: "customer", isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalValue: { $sum: "$pricing.grandTotal" },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$payment.status",
            count: { $sum: 1 },
            totalValue: { $sum: "$pricing.grandTotal" },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            "payment.status": "completed",
            status: { $nin: ["cancelled", "refunded"] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$pricing.grandTotal" },
          },
        },
      ]),
      Order.find()
        .sort({ placedAt: -1 })
        .limit(8)
        .populate("userId", "fullName email mobileNumber")
        .lean(),
    ]);

    const ordersByStatus = orderStatusBuckets.reduce((acc, bucket) => {
      acc[bucket._id || "unknown"] = {
        count: bucket.count,
        totalValue: bucket.totalValue || 0,
      };
      return acc;
    }, {});

    const paymentsByStatus = paymentStatusBuckets.reduce((acc, bucket) => {
      acc[bucket._id || "unknown"] = {
        count: bucket.count,
        totalValue: bucket.totalValue || 0,
      };
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          products: {
            total: totalProducts,
            active: activeProducts,
            inactive: Math.max(totalProducts - activeProducts, 0),
          },
          customers: {
            total: totalCustomers,
          },
          orders: {
            total: totalOrders,
            byStatus: ordersByStatus,
          },
          payments: {
            byStatus: paymentsByStatus,
          },
          revenue: {
            captured: revenueAgg[0]?.totalRevenue || 0,
          },
        },
        recentOrders: recentOrders.map((order) => ({
          id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          placedAt: order.placedAt,
          grandTotal: order.pricing?.grandTotal || 0,
          paymentStatus: order.payment?.status || "pending",
          paymentMethod: order.payment?.method || "N/A",
          customer: {
            id: order.userId?._id || null,
            name: order.userId?.fullName || order.customer?.name || "Guest",
            email: order.userId?.email || order.customer?.email || "",
            phone: order.userId?.mobileNumber || order.customer?.phone || "",
          },
        })),
      },
    });
  } catch (error) {
    console.error("Get admin overview error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin dashboard overview",
      error: error.message,
    });
  }
};

/**
 * @desc    Get payment records for admin dashboard
 * @route   GET /api/admin/payments
 * @access  Private/Admin
 */
exports.getPayments = async (req, res) => {
  try {
    const {
      status,
      method,
      fromDate,
      toDate,
      q = "",
      page = 1,
      limit = 20,
      sortBy = "placedAt",
      sortOrder = "desc",
    } = req.query;

    const numericPage = parsePositiveInt(page, 1);
    const numericLimit = Math.min(parsePositiveInt(limit, 20), 100);
    const skip = (numericPage - 1) * numericLimit;

    const filter = {};
    if (status) {
      filter["payment.status"] = status;
    }
    if (method) {
      filter["payment.method"] = method;
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

    const trimmedQuery = q.trim();
    if (trimmedQuery) {
      const regex = new RegExp(trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { orderNumber: regex },
        { "payment.transactionId": regex },
        { "customer.name": regex },
        { "customer.email": regex },
        { "customer.phone": regex },
      ];
    }

    const sortMap = {
      placedAt: "placedAt",
      amount: "pricing.grandTotal",
      paymentStatus: "payment.status",
      paidAt: "payment.paidAt",
    };

    const sortField = sortMap[sortBy] || "placedAt";
    const direction = sortOrder === "asc" ? 1 : -1;

    const [orders, total, statusBuckets, methodBuckets] = await Promise.all([
      Order.find(filter)
        .sort({ [sortField]: direction })
        .skip(skip)
        .limit(numericLimit)
        .populate("userId", "fullName email mobileNumber")
        .lean(),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$payment.status",
            count: { $sum: 1 },
            totalValue: { $sum: "$pricing.grandTotal" },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$payment.method",
            count: { $sum: 1 },
            totalValue: { $sum: "$pricing.grandTotal" },
          },
        },
        { $sort: { totalValue: -1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        records: orders.map((order) => ({
          id: order._id,
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.status,
          placedAt: order.placedAt,
          paidAt: order.payment?.paidAt || null,
          amount: order.pricing?.grandTotal || 0,
          method: order.payment?.method || "N/A",
          paymentStatus: order.payment?.status || "pending",
          transactionId: order.payment?.transactionId || "",
          customer: {
            id: order.userId?._id || null,
            name: order.userId?.fullName || order.customer?.name || "Guest",
            email: order.userId?.email || order.customer?.email || "",
            phone: order.userId?.mobileNumber || order.customer?.phone || "",
          },
        })),
        pagination: buildPagination({
          page: numericPage,
          limit: numericLimit,
          total,
        }),
        aggregates: {
          byPaymentStatus: statusBuckets.map((bucket) => ({
            status: bucket._id || "unknown",
            count: bucket.count,
            totalValue: bucket.totalValue || 0,
          })),
          byPaymentMethod: methodBuckets.map((bucket) => ({
            method: bucket._id || "unknown",
            count: bucket.count,
            totalValue: bucket.totalValue || 0,
          })),
        },
      },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment records",
      error: error.message,
    });
  }
};

