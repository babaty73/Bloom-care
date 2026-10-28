import config from "./env.js";

export function assertProductionReady() {
  const required = {
    MONGODB_URI: Boolean((process.env.MONGODB_URI || "").trim()),
    JWT_SECRET: Boolean((process.env.JWT_SECRET || "").trim()),
    CORS_ORIGIN: Boolean((process.env.CORS_ORIGIN || "").trim()),
    CLOUDINARY_CLOUD_NAME: Boolean((process.env.CLOUDINARY_CLOUD_NAME || "").trim()),
    CLOUDINARY_API_KEY: Boolean((process.env.CLOUDINARY_API_KEY || "").trim()),
    CLOUDINARY_API_SECRET: Boolean((process.env.CLOUDINARY_API_SECRET || "").trim()),
    CLOUDINARY_AUTH_TOKEN_KEY: Boolean((process.env.CLOUDINARY_AUTH_TOKEN_KEY || "").trim()),
  };

  const missingKeys = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingKeys.length > 0) {
    throw new Error(`Production readiness check failed: missing ${missingKeys.join(", ")}`);
  }
}
