import mongoose from "mongoose";
import config from "./env.js";

export async function connectDatabase() {
  if (!config.mongodbUri) {
    console.warn("MONGODB_URI is not configured; starting without a database connection.");
    return;
  }

  await mongoose.connect(config.mongodbUri);
  console.log("MongoDB connected");
}
