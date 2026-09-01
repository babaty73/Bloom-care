import { Router } from "express";
import * as pharmacyController from "../controllers/pharmacy.controller.js";
import * as medicineController from "../controllers/medicine.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
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

router.get("/me", authMiddleware, requireRole("pharmacy"), pharmacyController.getOwnProfile);
router.patch("/me", authMiddleware, requireRole("pharmacy"), validatePharmacyProfileUpdate, pharmacyController.updateOwnProfile);
router.get("/me/dashboard", authMiddleware, requireRole("pharmacy"), pharmacyController.getOwnDashboard);

// Medicine management, scoped to the authenticated pharmacy (ownership enforced in the service layer).
// GET /me/medicines is a technically necessary addition beyond the documented API
// table — see the implementation report for why it's needed and what to reconcile
// in docs/ARCHITECTURE.md.
router.get("/me/medicines", authMiddleware, requireRole("pharmacy"), validatePagination, medicineController.listOwnMedicines);
router.post("/me/medicines", authMiddleware, requireRole("pharmacy"), validateMedicineCreate, medicineController.createMedicine);
router.patch(
  "/me/medicines/:id",
  authMiddleware,
  requireRole("pharmacy"),
  validateObjectIdParam("id"),
  validateMedicineUpdate,
  medicineController.updateMedicine,
);
router.delete(
  "/me/medicines/:id",
  authMiddleware,
  requireRole("pharmacy"),
  validateObjectIdParam("id"),
  medicineController.deleteMedicine,
);

// --- Public route ---
router.get("/:id", validateObjectIdParam("id"), pharmacyController.getPharmacyById);

export default router;
