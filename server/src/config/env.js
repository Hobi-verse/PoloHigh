const dotenv = require("dotenv");

dotenv.config({ quiet: true });

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value) => {
  if (!value) {
    return [
      "https://www.polohigh.shop",
      "https://polohigh.shop",
      "http://localhost:5173",
    ];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseNumber(process.env.PORT, 4000),
  apiPrefix: process.env.API_PREFIX || "/api",
  mongoUri: process.env.MONGODB_URI || process.env.MONGODB_URL || "",
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  sessionSecret:
    process.env.SESSION_SECRET || "your-session-secret-change-in-production",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  corsOrigins: parseOrigins(process.env.CORS_ALLOWED_ORIGINS),
  bodyLimit: process.env.BODY_LIMIT || "10mb",
};
