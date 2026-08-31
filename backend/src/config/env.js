import "dotenv/config";

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port <= 0) {
  throw new Error("PORT must be a positive integer");
}

const config = {
  port,
  mongodbUri: process.env.MONGODB_URI || "",
};

export default config;
