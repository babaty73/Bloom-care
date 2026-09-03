import * as reportService from "../services/report.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function submitReport(req, res, next) {
  try {
    const { medicineId, pharmacyId, reason, additionalComment } = req.body;
    const report = await reportService.createReport({ medicineId, pharmacyId, reason, additionalComment });
    return sendSuccess(res, {
      statusCode: 201,
      data: report,
      message: "Report submitted successfully",
    });
  } catch (err) {
    return next(err);
  }
}

// Mounted under /api/pharmacies/me/reports (pharmacy.routes.js) — see
// docs/ARCHITECTURE.md §2.4, where this endpoint is documented as part of the
// Reports domain despite living under the /pharmacies path, mirroring how
// pharmacy-owned medicine CRUD is mounted under /pharmacies/me/medicines.
export async function listOwnReports(req, res, next) {
  try {
    const pharmacyId = req.auth.sub;
    const result = await reportService.listReportsForPharmacy(pharmacyId, req.pagination);
    return sendSuccess(res, {
      statusCode: 200,
      data: result,
      message: "Reports retrieved successfully",
    });
  } catch (err) {
    return next(err);
  }
}
