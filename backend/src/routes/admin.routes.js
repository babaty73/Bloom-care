import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  validateObjectIdParam,
  validatePagination,
  validatePharmacyStatusUpdate,
  validateAdminPharmacyFilters,
  validateReportFilters,
  validateReportStatusUpdate,
} from "../middleware/validate.middleware.js";

// Contract: docs/ARCHITECTURE.md §2.5. All routes here require an authenticated
// admin (role === "admin"). No admin registration/provisioning endpoint exists —
// that remains PENDING CONFIRMATION per docs/IMPLEMENTATION_DECISIONS.md.

const router = Router();

router.use(authMiddleware, requireRole("admin"));

router.get("/dashboard", adminController.getDashboard);

router.get("/pharmacies", validateAdminPharmacyFilters, validatePagination, adminController.listPharmacies);
router.patch(
  "/pharmacies/:id/status",
  validateObjectIdParam("id"),
  validatePharmacyStatusUpdate,
  adminController.updatePharmacyStatus,
);
router.delete("/pharmacies/:id", validateObjectIdParam("id"), adminController.deletePharmacy);

router.delete("/medicines/:id", validateObjectIdParam("id"), adminController.deleteMedicine);

router.get("/reports", validateReportFilters, validatePagination, adminController.listReports);
router.patch("/reports/:id", validateObjectIdParam("id"), validateReportStatusUpdate, adminController.reviewReport);

export default router;
