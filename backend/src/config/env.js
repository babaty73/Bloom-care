import "dotenv/config";

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const jwtSecret = process.env.JWT_SECRET || "";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || "";

// Comma-separated list of allowed frontend origins (usually just one). Each
// value is trimmed and has any trailing slash stripped — browsers never send
// a trailing slash in the Origin header, so a CORS_ORIGIN value accidentally
// configured with one would otherwise silently fail to match and block every
// cross-origin request. Defaults to the local Vite dev server if unset.
const corsOrigin = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const config = {
  port,
  mongodbUri: process.env.MONGODB_URI || "",
  jwtSecret,
  jwtExpiresIn,
  bcryptSaltRounds,
  geoapifyApiKey,
  corsOrigin,
};

export default config;
