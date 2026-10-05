import { v2 as cloudinary } from "cloudinary";
import config from "./env.js";

// Contract: Cloudinary License-Document Decision (docs/IMPLEMENTATION_DECISIONS.md).
// Backend-only credentials — never sent to the frontend, never read from a
// VITE_-prefixed env var. Configured once at import time.
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
  secure: true,
});

export function isCloudinaryConfigured() {
  return Boolean(config.cloudinaryCloudName && config.cloudinaryApiKey && config.cloudinaryApiSecret);
}

export default cloudinary;
