import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";
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
 * - type: "authenticated" — the resulting asset is PRIVATE. Its secureUrl is
 *   not a working public URL; viewing it requires a signed URL generated
 *   on-demand (see getSignedLicenseDocumentUrl below). This is the core of
 *   the "never publicly exposed" requirement.
 * - no client-supplied public_id — Cloudinary generates one, so a caller
 *   can never collide with or overwrite another pharmacy's document.
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
          secureUrl: result.secure_url,
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

/**
 * Generates a signed, time-scoped URL for an admin to view a pharmacy's
 * license document. Generated fresh on every call and NEVER persisted
 * anywhere (not on the Pharmacy document, not cached) — contract requirement
 * that the document must only ever be reachable through a freshly-issued,
 * admin-gated URL.
 *
 * Known limitation (documented, not silently glossed over): `sign_url: true`
 * cryptographically signs the URL's transformation/delivery parameters, but
 * Cloudinary only enforces an actual *expiring* signature (via `expires_at`)
 * for accounts with "strict transformations" / authenticated-asset delivery
 * fully enabled. Without that account-level setting, this signed URL is
 * effectively a long-lived capability URL rather than a short-TTL token. The
 * "authenticated" resource type still means the asset has no public URL at
 * all without going through this signing step, but true per-request
 * expiration depends on Cloudinary account configuration. Flagged in the
 * final report as a residual limitation.
 */
export function getSignedLicenseDocumentUrl(publicId, resourceType, format) {
  if (!publicId) return null;
  return cloudinary.url(publicId, {
    resource_type: resourceType || "image",
    type: "authenticated",
    format,
    sign_url: true,
    secure: true,
  });
}
