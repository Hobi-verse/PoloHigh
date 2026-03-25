const mongoose = require("mongoose");

const tokenBlacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

tokenBlacklistSchema.statics.addToken = async function (token, expiresAt) {
  if (!token || !expiresAt) {
    return null;
  }

  return this.updateOne(
    { token },
    { token, expiresAt },
    { upsert: true, setDefaultsOnInsert: true }
  );
};

tokenBlacklistSchema.statics.hasToken = function (token) {
  if (!token) {
    return Promise.resolve(false);
  }

  return this.exists({ token }).then(Boolean);
};

module.exports = mongoose.model("TokenBlacklist", tokenBlacklistSchema);
