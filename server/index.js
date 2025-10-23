// Load environment variables FIRST before anything else
require('dotenv').config();

const express = require("express");
const app = express();
const cors = require("cors");
const session = require("express-session");
const passport = require("./config/passport");

const dataBase = require("./config/dataBase");
const authRoutes = require("./routes/authRoutes");
const debugRoutes = require("./routes/debugRoutes");
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
const adminRoutes = require("./routes/adminRoutes");

const PORT = process.env.PORT || 4000;

//middleware - Enable CORS for frontend communication
const allowedOrigins = [
  "https://ciyatake.shop",
  "https://www.ciyatake.shop",
  "http://localhost:5173"
];
app.use(cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Session configuration for Google OAuth
// NOTE: In production, replace MemoryStore with Redis or MongoDB session store
app.use(session({
  secret: process.env.SESSION_SECRET || "your-session-secret-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  // TODO: Add Redis session store for production scaling
  // store: new RedisStore({ ... })
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

dataBase.connect();

//routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/auth", debugRoutes); // Debug routes for development
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
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "your server is running",
  });
});

// Health check endpoint for monitoring and keep-alive
app.get("/health", (req, res) => {
  return res.json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
  
  // Keep-alive ping for Render free tier (prevents service from sleeping)
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const https = require('https');
    console.log('🏓 Keep-alive enabled for Render deployment');
    
    setInterval(() => {
      const url = process.env.RENDER_EXTERNAL_URL + '/health';
      https.get(url, (res) => {
        console.log(`🏓 Keep-alive ping: ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('❌ Keep-alive ping failed:', err.message);
      });
    }, 14 * 60 * 1000); // Ping every 14 minutes
  }
});
