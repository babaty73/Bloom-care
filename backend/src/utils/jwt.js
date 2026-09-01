import jwt from "jsonwebtoken";
import config from "../config/env.js";

// Contract: docs/ARCHITECTURE.md Authentication Contract.
// Payload shape is exactly { sub, role }. No refresh tokens for MVP. 7-day lifetime.

export function signToken({ sub, role }) {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ sub, role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  if (!config.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.verify(token, config.jwtSecret);
}
