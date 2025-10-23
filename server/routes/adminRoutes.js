const express = require("express");
const router = express.Router();

const {
  getDashboardMetrics,
  getRecentActivities,
} = require("../Controllers/adminController");
const { protect, restrictTo } = require("../middleware/authMiddleware");

router.get(
  "/dashboard/metrics",
  protect,
  restrictTo("admin"),
  getDashboardMetrics
);

router.get(
  "/activities",
  protect,
  restrictTo("admin"),
  getRecentActivities
);

module.exports = router;
