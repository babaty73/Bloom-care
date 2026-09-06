import { Router } from "express";
import * as pharmacyController from "../controllers/pharmacy.controller.js";
import * as medicineController from "../controllers/medicine.controller.js";
import * as reportController from "../controllers/report.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { requireActivePharmacy } from "../middleware/pharmacyStatus.middleware.js";
import {
  validateObjectIdParam,
  validatePharmacyProfileUpdate,
  validateMedicineCreate,
  validateMedicineUpdate,
  validatePagination,
} from "../middleware/validate.middleware.js";

const router = Router();

// --- Authenticated pharmacy self-service routes ---
// NOTE: order matters — "/me..." routes must be registered before "/:id" so
// "me" is never captured as an :id param.
//
// All "/me..." routes require: valid JWT -> role === "pharmacy" -> account
// still ACTIVE. Applied once via router.use() on the "/me" prefix rather than
// repeated per-route, so no authenticated pharmacy route can accidentally skip
// the active-status check (production hardening fix — suspended/banned
// pharmacies must lose authenticated access, not just public visibility).
router.use("/me", authMiddleware, requireRole("pharmacy"), requireActivePharmacy());

router.get("/me", pharmacyController.getOwnProfile);
router.patch("/me", validatePharmacyProfileUpdate, pharmacyController.updateOwnProfile);
router.get("/me/dashboard", pharmacyController.getOwnDashboard);

// Medicine management, scoped to the authenticated pharmacy (ownership enforced in the service layer).
// GET /me/medicines is a technically necessary addition beyond the documented API
// table — see the implementation report for why it's needed and what to reconcile
// in docs/ARCHITECTURE.md.
router.get("/me/medicines", validatePagination, medicineController.listOwnMedicines);
router.post("/me/medicines", validateMedicineCreate, medicineController.createMedicine);
router.patch(
  "/me/medicines/:id",
  validateObjectIdParam("id"),
  validateMedicineUpdate,
  medicineController.updateMedicine,
);
router.delete("/me/medicines/:id", validateObjectIdParam("id"), medicineController.deleteMedicine);

// Reports concerning this pharmacy's own listings. Contract: docs/ARCHITECTURE.md
// §2.4 (documented under the Reports domain, mounted here under /pharmacies/me —
// same pattern as the medicine CRUD block above). Controller/service logic lives
// in report.controller.js/report.service.js (Reports domain), not duplicated here.
router.get("/me/reports", validatePagination, reportController.listOwnReports);

// --- Public route ---
router.get("/:id", validateObjectIdParam("id"), pharmacyController.getPharmacyById);

export default router;
