import type { AuthenticatedPharmacy } from "./auth.types";
import type { ReportReason } from "./report.types";

// Contract: docs/ARCHITECTURE.md §2.5. Admin-authenticated data shapes only.

export interface AdminDashboardStats {
  pharmacies: { total: number; active: number; suspended: number; banned: number };
  totalMedicines: number;
  reports: { total: number; pending: number };
}

export type PharmacyStatus = "ACTIVE" | "SUSPENDED" | "BANNED";

export interface PaginatedPharmacies {
  items: AuthenticatedPharmacy[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export type AdminReportStatus = "PENDING" | "RESOLVED" | "REJECTED";

// Describes GET /api/pharmacies/me/reports (pharmacy's own report view,
// Domain 2 — not modified here). Kept exactly as before.
export interface AdminReport {
  _id: string;
  medicineId: string;
  pharmacyId: string;
  reason: ReportReason;
  additionalComment: string | null;
  status: AdminReportStatus;
  createdAt: string;
}

export interface PaginatedAdminReports {
  items: AdminReport[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

// Describes GET/PATCH /api/admin/reports (admin-only). This endpoint now
// populates medicine/pharmacy display names server-side (report.service.js
// listReportsForAdmin/updateReportStatus) instead of returning raw ObjectIds —
// null means the referenced medicine/pharmacy no longer exists (deleted).
export interface AdminReportListItem {
  _id: string;
  medicine: { _id: string; medicineName: string; genericName: string } | null;
  pharmacy: { _id: string; pharmacyName: string } | null;
  reason: ReportReason;
  additionalComment: string | null;
  status: AdminReportStatus;
  createdAt: string;
}

export interface PaginatedAdminReportListItems {
  items: AdminReportListItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminReportFilters {
  status?: AdminReportStatus;
  pharmacyId?: string;
  medicineId?: string;
}
