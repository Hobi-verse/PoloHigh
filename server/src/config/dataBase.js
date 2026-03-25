const { connectToDatabase } = require("./database");

// Backward-compatible wrapper for legacy imports.
exports.connect = connectToDatabase;
