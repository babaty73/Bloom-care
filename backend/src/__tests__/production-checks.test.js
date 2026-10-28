import { describe, it, expect } from "vitest";
import { assertProductionReady } from "../config/productionChecks.js";

describe("production readiness checks", () => {
  it("allows a valid production config shape", () => {
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_AUTH_TOKEN_KEY: process.env.CLOUDINARY_AUTH_TOKEN_KEY,
    };

    process.env.NODE_ENV = "production";
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.JWT_SECRET = "secret";
    process.env.CORS_ORIGIN = "https://example.com";
    process.env.CLOUDINARY_CLOUD_NAME = "demo";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";
    process.env.CLOUDINARY_AUTH_TOKEN_KEY = "token";

    expect(() => assertProductionReady()).not.toThrow();

    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });

  it("throws when required production values are missing", () => {
    const previous = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI,
      JWT_SECRET: process.env.JWT_SECRET,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_AUTH_TOKEN_KEY: process.env.CLOUDINARY_AUTH_TOKEN_KEY,
    };

    process.env.NODE_ENV = "production";
    delete process.env.MONGODB_URI;
    delete process.env.JWT_SECRET;
    delete process.env.CLOUDINARY_CLOUD_NAME;
    delete process.env.CLOUDINARY_API_KEY;
    delete process.env.CLOUDINARY_API_SECRET;
    delete process.env.CLOUDINARY_AUTH_TOKEN_KEY;

    expect(() => assertProductionReady()).toThrow(/missing/i);

    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  });
});
