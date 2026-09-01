import { ApiError } from "../utils/apiResponse.js";

// Role-based authorization. Must run after authMiddleware (needs req.auth).
// This is the actual security boundary — frontend route guards are UX-only.
export function requireRole(...allowedRoles) {
  return function roleGuard(req, res, next) {
    if (!req.auth) {
      return next(new ApiError(401, "AUTHENTICATION_REQUIRED", "Authentication is required"));
    }
    if (!allowedRoles.includes(req.auth.role)) {
      return next(new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action"));
    }
    return next();
  };
}
