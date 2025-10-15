// Load environment variables FIRST before anything else
require('dotenv').config();

const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

const dataBase = require("./config/dataBase");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const customerProfileRoutes = require("./routes/customerProfileRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const searchRoutes = require("./routes/searchRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const PORT = process.env.PORT || 4000;

//middleware - Enable CORS for frontend communication
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Session configuration for Google OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

dataBase.connect();

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/profile", customerProfileRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/payments", paymentRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "your server is running",
  });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
