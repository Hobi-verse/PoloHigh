const express = require("express");
const corsMiddleware = require("./config/cors");
const sessionMiddleware = require("./config/session");
const env = require("./config/env");
const passport = require("./config/passport");
const apiRoutes = require("./routes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");

app.use(corsMiddleware);
app.use(express.json({
  limit: env.bodyLimit,
  verify: (req, res, buffer) => {
    req.rawBody = buffer.toString("utf8");
  },
}));
app.use(express.urlencoded({ limit: env.bodyLimit, extended: true }));

app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
  });
});

app.use(env.apiPrefix, apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
