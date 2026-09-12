import app from "./app.js";
import config from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      console.log(`Bloom-Care backend running on port ${config.port}`);
    });

    // Minimal graceful shutdown for SIGTERM/SIGINT. Render sends SIGTERM
    // before restarting or redeploying a service; without handling it,
    // in-flight requests get cut off abruptly instead of finishing.
    let isShuttingDown = false;
    async function shutdown(signal) {
      if (isShuttingDown) return;
      isShuttingDown = true;
      console.log(`${signal} received, shutting down gracefully...`);

      // Safety net: if something hangs, don't let the process linger
      // forever — most hosts force-kill after a grace period anyway, but
      // this ensures a clean, predictable exit regardless.
      const forceExitTimer = setTimeout(() => {
        console.error("Graceful shutdown timed out; forcing exit.");
        process.exit(1);
      }, 10000);
      forceExitTimer.unref();

      server.close(async () => {
        try {
          await disconnectDatabase();
        } catch (err) {
          console.error("Error closing MongoDB connection during shutdown:", err);
        }
        console.log("Shutdown complete.");
        process.exit(0);
      });
    }

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start Bloom-Care backend:", error);
    process.exit(1);
  }
}

startServer();
