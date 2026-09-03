import { apiRequest } from "../utils/api";
import type { AuthenticatedPharmacy } from "../types/auth.types";
import type {
  AdminDashboardStats,
  PaginatedPharmacies,
  PharmacyStatus,
  AdminReport,
  PaginatedAdminReports,
  AdminReportFilters,
} from "../types/admin.types";

export function getDashboard() {
  return apiRequest<AdminDashboardStats>("/admin/dashboard");
}

export function listPharmacies(status?: PharmacyStatus, page = 1, limit = 20) {
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  query.set("page", String(page));
  query.set("limit", String(limit));
  return apiRequest<PaginatedPharmacies>(`/admin/pharmacies?${query.toString()}`);
}

export function updatePharmacyStatus(id: string, status: PharmacyStatus) {
  return apiRequest<AuthenticatedPharmacy>(`/admin/pharmacies/${id}/status`, { method: "PATCH", body: { status } });
}

export function deletePharmacy(id: string) {
  return apiRequest<void>(`/admin/pharmacies/${id}`, { method: "DELETE" });
}

export function deleteMedicine(id: string) {
  return apiRequest<void>(`/admin/medicines/${id}`, { method: "DELETE" });
}

export function listReports(filters: AdminReportFilters = {}, page = 1, limit = 20) {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.pharmacyId) query.set("pharmacyId", filters.pharmacyId);
  if (filters.medicineId) query.set("medicineId", filters.medicineId);
  query.set("page", String(page));
  query.set("limit", String(limit));
  return apiRequest<PaginatedAdminReports>(`/admin/reports?${query.toString()}`);
}

export function reviewReport(id: string, status: "RESOLVED" | "REJECTED") {
  return apiRequest<AdminReport>(`/admin/reports/${id}`, { method: "PATCH", body: { status } });
}
