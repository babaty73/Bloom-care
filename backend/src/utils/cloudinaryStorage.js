import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
import config from "../config/env.js";
import { ApiError } from "./apiResponse.js";

// Contract: Cloudinary License-Document Decision (docs/IMPLEMENTATION_DECISIONS.md).
// All license-document storage goes through this module. Uploads are always
// backend-initiated (server-side signed upload via the Node SDK) — there is
// no unsigned/client-side upload preset anywhere in this codebase, so a
// Cloudinary API secret never needs to reach the browser.

const LICENSE_FOLDER = "bloom-care/licenses";

/**
 * Uploads a license-document file buffer to Cloudinary.
 *
 * - folder: dedicated "bloom-care/licenses" folder, never mixed with any
 *   other asset type.
 * - resource_type: "auto" — accepts both images (JPG/PNG) and PDFs (which
 *   Cloudinary stores as an "image" resource with multi-page support, or as
 *   "raw" depending on account settings; "auto" lets Cloudinary decide
 *   correctly rather than the app guessing).
 * - type: "authenticated" — the resulting asset is PRIVATE and has no
 *   working public URL at all. Viewing it requires a short-lived signed URL
 *   generated on-demand (see getSignedLicenseDocumentUrl below). This is the
 *   core of the "never publicly exposed" requirement.
 * - no client-supplied public_id — Cloudinary generates one, so a caller
 *   can never collide with or overwrite another pharmacy's document.
 *
 * Cloudinary's upload response also includes a `secure_url`, but for an
 * "authenticated" asset that URL is not a working link on its own (it still
 * needs signing/token auth to resolve), and the application always
 * regenerates a fresh viewing URL from publicId/resourceType/format on
 * demand anyway (see getSignedLicenseDocumentUrl) — so it is intentionally
 * NOT returned here or persisted anywhere (see models/Pharmacy.js
 * licenseDocument sub-schema). Keeping an unused, never-working URL around
 * would just be dead data with no purpose.
 */
export async function uploadLicenseDocument(buffer) {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Document storage is not configured");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: LICENSE_FOLDER,
        resource_type: "auto",
        type: "authenticated",
        overwrite: false,
      },
      (err, result) => {
        if (err) {
          return reject(new ApiError(500, "INTERNAL_SERVER_ERROR", "Failed to upload license document"));
        }
        resolve({
          publicId: result.public_id,
          resourceType: result.resource_type,
          format: result.format,
        });
      },
    );
    uploadStream.end(buffer);
  });
}

/**
 * Best-effort deletion. Called both for registration-rollback (upload
 * succeeded but Pharmacy.create() failed afterward — see auth.service.js)
 * and any future replace/remove flow. Never throws — a failed cleanup must
 * not fail the caller's own already-in-progress error handling, and the
 * document's content is never logged, only its publicId.
 */
export async function deleteLicenseDocument(publicId, resourceType) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType || "image",
      type: "authenticated",
    });
  } catch (err) {
    console.warn(`[license document] failed to delete Cloudinary asset ${publicId}: ${err.message}`);
  }
}

// Default admin viewing-URL lifetime: 10 minutes. Short enough that a link
// pasted into a chat/ticket/screenshot is of little use shortly after, long
// enough for an admin to actually open and review the document once.
const DEFAULT_VIEW_URL_DURATION_SECONDS = 10 * 60;

/**
 * Generates a genuinely time-limited signed URL for an admin to view a
 * pharmacy's license document, using Cloudinary's token-based authentication
 * mechanism (the supported mechanism for expiring access to a private/
 * "authenticated" asset — see the Node SDK's `auth_token` option and
 * utils/auth_token.js, which embeds an `exp` timestamp into an HMAC-signed
 * token appended to the URL). Generated fresh on every call and NEVER
 * persisted anywhere (not on the Pharmacy document, not cached) — the
 * document must only ever be reachable through a freshly-issued,
 * admin-gated, short-lived URL.
 *
 * This is NOT the same as the plain `sign_url: true` used previously: that
 * only signs the URL's transformation/delivery parameters and carries no
 * expiry at all. `auth_token` embeds and HMAC-signs an actual `exp` (and
 * `acl`, restricting the token to this specific resource path), which
 * Cloudinary's delivery layer checks against the current time and rejects
 * once expired — but ONLY once "Token-based authentication" is turned on for
 * the Cloudinary account (Settings -> Security) with a matching signing key
 * configured as CLOUDINARY_AUTH_TOKEN_KEY. Without that account-level
 * toggle, Cloudinary does not enforce the token at delivery time even though
 * the URL still carries one — this is an account configuration step, not
 * something the application code can turn on by itself, and is called out
 * explicitly in docs/IMPLEMENTATION_DECISIONS.md.
 *
 * Fails loudly (ApiError) rather than silently falling back to a
 * non-expiring URL when the signing key isn't configured, since a silent
 * fallback would defeat the whole point without anyone noticing.
 */
export function getSignedLicenseDocumentUrl(publicId, resourceType, format, durationSeconds = DEFAULT_VIEW_URL_DURATION_SECONDS) {
  if (!publicId) return null;

  if (!config.cloudinaryAuthTokenKey) {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Document viewing is not configured (missing Cloudinary token-authentication key)",
    );
  }

  return cloudinary.url(publicId, {
    resource_type: resourceType || "image",
    type: "authenticated",
    format,
    sign_url: true,
    secure: true,
    auth_token: {
      key: config.cloudinaryAuthTokenKey,
      duration: durationSeconds,
    },
  });
}
