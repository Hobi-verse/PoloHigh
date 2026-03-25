const express = require("express");
const { protect, restrictTo } = require("../middleware/authMiddleware");
const { getOverview, getPayments } = require("../controllers/adminController");

const router = express.Router();

router.use(protect, restrictTo("admin"));

router.get("/overview", getOverview);
router.get("/payments", getPayments);

module.exports = router;

