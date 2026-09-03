import Report from "../models/Report.js";
import Medicine from "../models/Medicine.js";
import Pharmacy from "../models/Pharmacy.js";
import { ApiError } from "../utils/apiResponse.js";

// Contract: docs/ARCHITECTURE.md §2.4, docs/IMPLEMENTATION_DECISIONS.md Report
// Decisions. This file owns all Report domain logic; admin report-review
// endpoints (GET/PATCH /api/admin/reports) call listReportsForAdmin/
// updateReportStatus from here rather than duplicating the logic
// (docs/ARCHITECTURE.md "Admin service boundary").

/**
 * Public report submission. Contract: IMPLEMENTATION_DECISIONS.md Report
 * Decisions §6 "Referenced resources" — medicineId/pharmacyId must each
 * reference an existing document (404 if not), and medicine.pharmacyId must
 * equal the submitted pharmacyId (400 INCONSISTENT_PHARMACY_REFERENCE if not).
 * An expired medicine can still be reported — expiration is non-destructive.
 */
export async function createReport({ medicineId, pharmacyId, reason, additionalComment }) {
  const [medicine, pharmacy] = await Promise.all([
    Medicine.findById(medicineId),
    Pharmacy.findById(pharmacyId),
  ]);

  if (!medicine) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Medicine not found");
  }
  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }
  if (String(medicine.pharmacyId) !== String(pharmacyId)) {
    throw new ApiError(
      400,
      "INCONSISTENT_PHARMACY_REFERENCE",
      "The referenced medicine does not belong to the referenced pharmacy",
    );
  }

  const report = await Report.create({
    medicineId,
    pharmacyId,
    reason,
    additionalComment: additionalComment?.trim() || null,
  });

  return report;
}

/** Pharmacy's own reports. Contract: Report Decisions §5 — pharmacies may view
 * reports concerning their own pharmacy/listings only. */
export async function listReportsForPharmacy(pharmacyId, { page, limit }) {
  const filter = { pharmacyId };
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/** Admin view across all reports, with optional filters. Contract: ARCHITECTURE.md §2.4. */
export async function listReportsForAdmin({ status, pharmacyId, medicineId }, { page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (pharmacyId) filter.pharmacyId = pharmacyId;
  if (medicineId) filter.medicineId = medicineId;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Report.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments(filter),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

/**
 * Admin report-review decision. Contract: Report Decisions §3-§4 — only
 * PENDING → RESOLVED and PENDING → REJECTED are valid transitions.
 */
export async function updateReportStatus(reportId, nextStatus) {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Report not found");
  }
  if (report.status !== "PENDING") {
    throw new ApiError(400, "VALIDATION_ERROR", "Only a PENDING report can be resolved or rejected", [
      `current status is ${report.status}`,
    ]);
  }

  report.status = nextStatus;
  await report.save();
  return report;
}

export async function countReportsByStatus() {
  const [total, pending] = await Promise.all([
    Report.countDocuments({}),
    Report.countDocuments({ status: "PENDING" }),
  ]);
  return { total, pending };
}
