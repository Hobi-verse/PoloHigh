const mongoose = require("mongoose");
const env = require("./env");

const connectToDatabase = async () => {
  if (!env.mongoUri) {
    throw new Error("Missing MongoDB connection string. Set MONGODB_URI.");
  }

  await mongoose.connect(env.mongoUri);
  console.log("DB connected successfully");
};

const disconnectFromDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};

module.exports = {
  connectToDatabase,
  disconnectFromDatabase,
};
