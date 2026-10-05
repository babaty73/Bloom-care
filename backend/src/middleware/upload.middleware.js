import multer from "multer";

// Contract: Cloudinary License-Document Decision. memoryStorage — the file
// buffer is held in memory only long enough to be streamed to Cloudinary; it
// is never written to local disk. Single file, 10MB limit, matching the
// documented maximum. Field name must be "licenseDocument" on the multipart
// request (see frontend RegisterPage.tsx).
export const uploadLicenseDocumentFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
}).single("licenseDocument");
