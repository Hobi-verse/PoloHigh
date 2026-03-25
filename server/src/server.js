const app = require("./app");
const env = require("./config/env");
const {
  connectToDatabase,
  disconnectFromDatabase,
} = require("./config/database");

const SHUTDOWN_TIMEOUT_MS = 10000;

const startServer = async () => {
  await connectToDatabase();

  const server = app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`${signal} received. Starting graceful shutdown.`);

    server.close(async () => {
      try {
        await disconnectFromDatabase();
        console.log("Graceful shutdown complete.");
        process.exit(0);
      } catch (error) {
        console.error("Shutdown failed:", error);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error("Forced shutdown due to timeout.");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
};

startServer().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
