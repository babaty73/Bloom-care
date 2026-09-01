import { ApiError } from "../utils/apiResponse.js";
import { verifyToken } from "../utils/jwt.js";

// Verifies the JWT and attaches { sub, role } to req.auth.
// This is authentication only; role-based authorization is handled by role.middleware.js.
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new ApiError(401, "AUTHENTICATION_REQUIRED", "Authentication is required"));
  }

  try {
    const payload = verifyToken(token);
    req.auth = { sub: payload.sub, role: payload.role };
    return next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new ApiError(401, "TOKEN_EXPIRED", "Session has expired, please log in again"));
    }
    return next(new ApiError(401, "AUTHENTICATION_REQUIRED", "Invalid or malformed token"));
  }
}
