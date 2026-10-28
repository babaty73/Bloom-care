import "dotenv/config";

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const jwtSecret = process.env.JWT_SECRET || "";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || "";

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";
const cloudinaryAuthTokenKey = process.env.CLOUDINARY_AUTH_TOKEN_KEY || "";

const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

if (process.env.NODE_ENV === "production") {
  const requiredVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "CLOUDINARY_AUTH_TOKEN_KEY",
  ];

  const missing = requiredVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required production env vars: ${missing.join(", ")}`);
  }
}

const config = {
  port,
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret,
  jwtExpiresIn,
  bcryptSaltRounds,
  geoapifyApiKey,
  corsOrigin,
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryAuthTokenKey,
};

export default config;
