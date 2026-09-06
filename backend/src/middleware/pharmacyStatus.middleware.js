import Pharmacy from "../models/Pharmacy.js";
import { ApiError } from "../utils/apiResponse.js";

// Pharmacy status enforcement (production hardening fix). A valid JWT only
// proves the token was issued to this pharmacy at some point in the last 7
// days — it says nothing about whether the account has since been suspended
// or banned by an admin. This middleware closes that gap: it must run after
// authMiddleware + requireRole("pharmacy") on every authenticated pharmacy
// route, so an existing token is rejected the moment the underlying account
// is no longer ACTIVE, not just at the next login.
//
// Scope: pharmacy-authenticated routes only. Does not affect admin routes
// (Admin has no `status` field) or any public/visitor-facing route (those
// already exclude non-ACTIVE pharmacies via getPublicVisibilityFilter-style
// checks in pharmacy.service.js / medicine.service.js, unchanged by this).
export function requireActivePharmacy() {
  return async function activePharmacyGuard(req, res, next) {
    try {
      const pharmacy = await Pharmacy.findById(req.auth.sub, "status");

      if (!pharmacy) {
        // Account no longer exists (e.g. admin deleted it) — the token no
        // longer corresponds to anything; treat as unauthenticated rather
        // than a permissions issue.
        return next(new ApiError(401, "AUTHENTICATION_REQUIRED", "Pharmacy account no longer exists"));
      }

      if (pharmacy.status !== "ACTIVE") {
        return next(new ApiError(403, "FORBIDDEN", "This pharmacy account is suspended or banned"));
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}
