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

export interface AdminReportFilters {
  status?: AdminReportStatus;
  pharmacyId?: string;
  medicineId?: string;
}
