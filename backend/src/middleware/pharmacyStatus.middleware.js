import Pharmacy from "../models/Pharmacy.js";
import { ApiError } from "../utils/apiResponse.js";

// Pharmacy status enforcement (production hardening fix). A valid JWT only
// proves the token was issued to this pharmacy at some point in the last 7
// days — it says nothing about whether the account has since been suspended
// or banned by an admin, or (Pharmacy Verification) whether its application
// is still pending or was rejected after the token was issued (e.g. an admin
// reversing a prior approval). This middleware closes that gap: it must run
// after authMiddleware + requireRole("pharmacy") on every authenticated
// pharmacy route, so an existing token is rejected the moment the underlying
// account is no longer operational, not just at the next login.
//
// Scope: pharmacy-authenticated routes only. Does not affect admin routes
// (Admin has no `status`/`verificationStatus` field) or any public/visitor-
// facing route (those already exclude non-operational pharmacies via their
// own checks in pharmacy.service.js / medicine.service.js, unchanged by this).
export function requireActivePharmacy() {
  return async function activePharmacyGuard(req, res, next) {
    try {
      const pharmacy = await Pharmacy.findById(req.auth.sub, "status verificationStatus");

      if (!pharmacy) {
        // Account no longer exists (e.g. admin deleted it) — the token no
        // longer corresponds to anything; treat as unauthenticated rather
        // than a permissions issue.
        return next(new ApiError(401, "AUTHENTICATION_REQUIRED", "Pharmacy account no longer exists"));
      }

      // Pharmacy Verification: operational access requires BOTH an APPROVED
      // application AND an ACTIVE account (docs/IMPLEMENTATION_DECISIONS.md
      // Pharmacy Verification Decision). Checked before `status` since it's
      // usually the more specific, relevant reason for a pharmacy that has
      // never been approved.
      if (pharmacy.verificationStatus === "PENDING") {
        return next(new ApiError(403, "FORBIDDEN", "Your pharmacy application is still awaiting admin review"));
      }
      if (pharmacy.verificationStatus === "REJECTED") {
        return next(new ApiError(403, "FORBIDDEN", "Your pharmacy application was not approved"));
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
