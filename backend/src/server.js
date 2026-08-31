import app from "./app.js";
import config from "./config/env.js";
import { connectDatabase } from "./config/db.js";

async function startServer() {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      console.log(`Bloom-Care backend running on port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to start Bloom-Care backend:", error);
    process.exit(1);
  }
}

startServer();
