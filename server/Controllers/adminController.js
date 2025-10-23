const Order = require("../models/Order");
const ActivityLog = require("../models/ActivityLog");

exports.getDashboardMetrics = async (req, res) => {
  try {
    const SALES_WINDOW_DAYS = 30;
    const PREVIOUS_WINDOW_DAYS = SALES_WINDOW_DAYS * 2;
    const NEW_ORDER_WINDOW_DAYS = 7;

    const now = new Date();

    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - SALES_WINDOW_DAYS);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - SALES_WINDOW_DAYS);

    const recentOrdersStart = new Date(now);
    recentOrdersStart.setDate(recentOrdersStart.getDate() - NEW_ORDER_WINDOW_DAYS);

    const fulfilmentStatuses = ["pending", "confirmed", "processing", "packed"];
    const deliveredStatuses = ["delivered", "shipped", "out-for-delivery", "confirmed"];

    const [
      currentSalesAgg,
      previousSalesAgg,
      newOrdersCount,
      awaitingFulfilmentCount,
      topProductAgg,
    ] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            status: { $in: deliveredStatuses },
            placedAt: { $gte: currentPeriodStart, $lte: now },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$pricing.grandTotal" },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            status: { $in: deliveredStatuses },
            placedAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: "$pricing.grandTotal" },
          },
        },
      ]),
      Order.countDocuments({ placedAt: { $gte: recentOrdersStart } }),
      Order.countDocuments({ status: { $in: fulfilmentStatuses } }),
      Order.aggregate([
        {
          $match: {
            status: { $in: deliveredStatuses },
            placedAt: { $gte: currentPeriodStart, $lte: now },
          },
        },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            unitsSold: { $sum: "$items.quantity" },
            name: { $first: "$items.title" },
          },
        },
        { $sort: { unitsSold: -1 } },
        { $limit: 1 },
      ]),
    ]);

    const currentSales = currentSalesAgg?.[0]?.totalSales ?? 0;
    const previousSales = previousSalesAgg?.[0]?.totalSales ?? 0;

    let salesTrend = 0;
    if (previousSales > 0) {
      salesTrend = (currentSales - previousSales) / previousSales;
    } else if (currentSales > 0) {
      salesTrend = 1;
    }

    const topProduct = topProductAgg?.[0]
      ? {
        name: topProductAgg[0].name ?? "Top selling product",
        unitsSold: topProductAgg[0].unitsSold ?? 0,
      }
      : {
        name: "No sales",
        unitsSold: 0,
      };

    return res.json({
      success: true,
      data: {
        totals: {
          sales: currentSales,
          trend: salesTrend,
        },
        newOrders: {
          count: newOrdersCount,
          awaitingFulfilment: awaitingFulfilmentCount,
        },
        topProduct,
        generatedAt: now.toISOString(),
        window: {
          current: {
            from: currentPeriodStart.toISOString(),
            to: now.toISOString(),
          },
          previous: {
            from: previousPeriodStart.toISOString(),
            to: currentPeriodStart.toISOString(),
          },
        },
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard metrics",
    });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.getRecentActivities(10);
    return res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Recent activities error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load recent activities",
    });
  }
};
