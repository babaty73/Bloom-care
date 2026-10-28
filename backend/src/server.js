import app from "./app.js";
import config from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { assertProductionReady } from "./config/productionChecks.js";
import { logger } from "./utils/logger.js";

async function startServer() {
  try {
    if (process.env.NODE_ENV === "production") {
      assertProductionReady();
    }

    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info("Bloom-Care backend started", { port: config.port, environment: process.env.NODE_ENV || "development" });
    });

    let isShuttingDown = false;
    async function shutdown(signal) {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info("Shutdown initiated", { signal });

      const forceExitTimer = setTimeout(() => {
        logger.error("Graceful shutdown timed out; forcing exit.");
        process.exit(1);
      }, 10000);
      forceExitTimer.unref();

      server.close(async () => {
        try {
          await disconnectDatabase();
        } catch (err) {
          logger.error("Error closing MongoDB connection during shutdown", {
            message: err.message,
          });
        }
        logger.info("Shutdown complete");
        process.exit(0);
      });
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start Bloom-Care backend", {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();
