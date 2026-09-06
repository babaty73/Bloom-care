import "dotenv/config";

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const jwtSecret = process.env.JWT_SECRET || "";
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "7d";
const bcryptSaltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY || "";
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

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
