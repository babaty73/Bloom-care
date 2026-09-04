import { Router } from "express";
import * as medicineController from "../controllers/medicine.controller.js";
import {
  validateObjectIdParam,
  validateMedicineSearchQuery,
  validateNearbyQuery,
  validatePagination,
} from "../middleware/validate.middleware.js";

// Contract: docs/ARCHITECTURE.md §2.2, docs/IMPLEMENTATION_DECISIONS.md Medicine
// Decisions #6-#11. Public, unauthenticated visitor endpoints only.
//
// Pharmacy-owned medicine CRUD (POST/PATCH/DELETE, and the pharmacy's own listing
// view) is a separate concern mounted under /api/pharmacies/me/medicines — see
// pharmacy.routes.js (Auth & Pharmacy domain). Not duplicated here.

const router = Router();

router.get(
  "/",
  validateMedicineSearchQuery,
  validateNearbyQuery,
  validatePagination,
  medicineController.searchMedicines,
);
router.get("/:id", validateObjectIdParam("id"), medicineController.getMedicineDetails);

export default router;
