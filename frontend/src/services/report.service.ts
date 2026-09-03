import { apiRequest } from "../utils/api";
import type { ReportSubmitPayload, ReportSubmitResult } from "../types/report.types";
import type { PaginatedAdminReports } from "../types/admin.types";

// Public report submission (Visitor & Admin domain — visitor-facing entry
// point/form), plus the pharmacy's own read-only report view. Admin
// report-management calls (GET /admin/reports, PATCH /admin/reports/:id) live in
// admin.service.ts instead, alongside the rest of the admin-authenticated calls.

export function submitReport(payload: ReportSubmitPayload) {
  return apiRequest<ReportSubmitResult>("/reports", { method: "POST", body: payload, auth: false });
}

// Reuses the admin report shape (same fields) rather than duplicating a type —
// see docs/ARCHITECTURE.md §2.4, Report Decisions §5 "pharmacies may view reports
// concerning their own pharmacy/listings" (read-only; status changes are admin-only).
export function listOwnReports(page = 1, limit = 20) {
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(limit));
  return apiRequest<PaginatedAdminReports>(`/pharmacies/me/reports?${query.toString()}`);
}
