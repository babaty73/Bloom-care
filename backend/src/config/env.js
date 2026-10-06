import "dotenv/config";

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const jwtSecret = process.env.JWT_SECRET || "";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || "";

// Cloudinary License-Document Decision (docs/IMPLEMENTATION_DECISIONS.md) —
// backend-only credentials. Never read a VITE_-prefixed equivalent; the
// frontend never talks to Cloudinary directly.
const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY || "";
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET || "";
// Separate from cloudinaryApiSecret above — this is the "Token-based
// authentication" signing key from the Cloudinary account's Security
// settings (Settings -> Security -> Token-based authentication), used ONLY
// to generate genuinely time-limited (`exp`-bound) signed URLs for viewing
// an authenticated/private asset. Token-based authentication must also be
// toggled ON for the account in that same settings page, or Cloudinary's CDN
// will not actually enforce the token's expiry. See
// utils/cloudinaryStorage.js getSignedLicenseDocumentUrl.
const cloudinaryAuthTokenKey = process.env.CLOUDINARY_AUTH_TOKEN_KEY || "";

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
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryAuthTokenKey,
};

export default config;
