import mongoose from "mongoose";
import config from "./env.js";

// Render (and most Node hosts) set NODE_ENV=production automatically for
// deployed services; it is left unset in local development by convention.
const isProduction = process.env.NODE_ENV === "production";

export async function connectDatabase() {
  if (!config.mongodbUri) {
    if (isProduction) {
      // Production must never silently start and accept traffic with no
      // database configured — every request would otherwise fail with a
      // confusing 500 (after a long Mongoose buffering timeout) instead of
      // the server failing fast and clearly at startup. Local/dev
      // environments may still boot without a database (e.g. to smoke-test
      // routing/validation without a local MongoDB running).
      throw new Error("MONGODB_URI is required in production but was not set.");
    }
    console.warn("MONGODB_URI is not configured; starting without a database connection.");
    return;
  }

  await mongoose.connect(config.mongodbUri);
  console.log("MongoDB connected");
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}
