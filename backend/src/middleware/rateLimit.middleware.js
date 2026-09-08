import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponse.js";

// Login brute-force protection (Auth & Security domain hardening). This is a
// simple per-IP request throttle — deliberately NOT account lockout, CAPTCHA,
// or a server-side session store, none of which the specification requires or
// this task authorizes. Tune the two constants below if requirements change;
// no other configuration surface is introduced.
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10; // per IP, per route, per window

// 429 Too Many Requests / TOO_MANY_REQUESTS are not in the documented status
// code / error code tables (docs/ARCHITECTURE.md), because rate limiting was
// not yet a concern when those were written. This is the standard HTTP status
// for this exact situation — no existing code fits (400/401/403 would all be
// misleading, since the request itself is well-formed and the credentials may
// be correct). Flagged for the same doc reconciliation as prior additions
// like LOCATION_UNRESOLVABLE/INVALID_QUANTITY.
//
// A factory (not a single shared instance): express-rate-limit keys its
// in-memory store by client IP only, not by route. Applying one shared
// instance to both login routes would let an attacker exhaust pharmacy-login
// and admin-login attempts from the same combined budget — worse, it would
// let unrelated pharmacy login attempts from a shared/NAT'd IP lock out that
// IP's admin login too. Each call to this factory creates its own counter.
export function createLoginRateLimiter() {
  return rateLimit({
    windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
    limit: LOGIN_RATE_LIMIT_MAX_ATTEMPTS,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      // Deliberately generic — no account-specific detail, no indication of
      // how close the client is to being unblocked.
      return sendError(res, {
        statusCode: 429,
        code: "TOO_MANY_REQUESTS",
        message: "Too many login attempts. Please try again later.",
      });
    },
  });
}
