import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { validateReportCreate } from "../middleware/validate.middleware.js";

// Contract: docs/ARCHITECTURE.md §2.4. Only the public submission endpoint is
// mounted here. GET /api/pharmacies/me/reports is mounted in pharmacy.routes.js
// (Auth & Pharmacy domain path, Reports domain controller — see report.controller.js).
// GET/PATCH /api/admin/reports/:id are mounted in admin.routes.js (Admin domain).

const router = Router();

router.post("/", validateReportCreate, reportController.submitReport);

export default router;
