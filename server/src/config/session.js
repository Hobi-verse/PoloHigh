const session = require("express-session");
const env = require("./env");

const sessionMiddleware = session({
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.nodeEnv === "production",
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: "lax",
  },
});

module.exports = sessionMiddleware;
