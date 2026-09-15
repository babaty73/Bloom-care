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

// Describes GET /api/pharmacies/me/reports (pharmacy's own report view).
// Populates medicineId -> { medicineName, genericName } server-side
// (report.service.js listReportsForPharmacy) instead of returning a raw
// ObjectId — null means the referenced medicine no longer exists (deleted).
// pharmacyId is intentionally not included: every report here already
// belongs to the requesting pharmacy, so it would be redundant.
//
// Domain 10 finding: the backend side of this populate change landed on main
// (commit 3ceb9be, "technical hardening") but this type — and the matching
// frontend rendering fix — did not. Left as AdminReport/medicineId: string,
// the pharmacy Reports page would read report.medicineId expecting a string
// and instead receive the populated { _id, medicineName, genericName }
// object, which React cannot render as a child — a certain runtime crash for
// any pharmacy with at least one report against them. Fixed here by
// finishing the frontend half of the same, already-tested change.
export interface PharmacyReportListItem {
  _id: string;
  medicine: { _id: string; medicineName: string; genericName: string } | null;
  reason: ReportReason;
  additionalComment: string | null;
  status: AdminReportStatus;
  createdAt: string;
}

export interface PaginatedPharmacyReportListItems {
  items: PharmacyReportListItem[];
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
