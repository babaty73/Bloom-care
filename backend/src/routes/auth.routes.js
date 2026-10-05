import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import {
  validatePharmacyRegister,
  validateLicenseDocument,
  validatePharmacyLogin,
  validateAdminLogin,
} from "../middleware/validate.middleware.js";
import { createLoginRateLimiter } from "../middleware/rateLimit.middleware.js";
import { uploadLicenseDocumentFile } from "../middleware/upload.middleware.js";

const router = Router();

// Independent limiter instances (see rateLimit.middleware.js) — pharmacy and
// admin login attempts must not share a counter.
//
// Multer (uploadLicenseDocumentFile) must run FIRST: it is what parses the
// multipart/form-data body at all, populating both req.body (text fields)
// and req.file (the license document) — validatePharmacyRegister and
// validateLicenseDocument both depend on it having already run.
router.post(
  "/pharmacy/register",
  uploadLicenseDocumentFile,
  validatePharmacyRegister,
  validateLicenseDocument,
  authController.registerPharmacy,
);
router.post("/pharmacy/login", createLoginRateLimiter(), validatePharmacyLogin, authController.loginPharmacy);
router.post("/admin/login", createLoginRateLimiter(), validateAdminLogin, authController.loginAdmin);

export default router;
