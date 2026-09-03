import { apiRequest } from "../utils/api";
import type {
  Medicine,
  MedicineCreatePayload,
  MedicineUpdatePayload,
  PaginatedMedicines,
  PaginatedPublicMedicines,
  PublicMedicineResult,
  PublicMedicineSearchParams,
} from "../types/medicine.types";

// NOTE: shared between the Auth & Pharmacy domain (pharmacy-owned CRUD/listing
// calls above) and the Visitor & Admin domain (public search/detail calls below).

export function listOwnMedicines(page = 1, limit = 20) {
  return apiRequest<PaginatedMedicines>(`/pharmacies/me/medicines?page=${page}&limit=${limit}`);
}

export function createMedicine(payload: MedicineCreatePayload) {
  return apiRequest<Medicine>("/pharmacies/me/medicines", { method: "POST", body: payload });
}

export function updateMedicine(id: string, payload: MedicineUpdatePayload) {
  return apiRequest<Medicine>(`/pharmacies/me/medicines/${id}`, { method: "PATCH", body: payload });
}

export function deleteMedicine(id: string) {
  return apiRequest<void>(`/pharmacies/me/medicines/${id}`, { method: "DELETE" });
}

// --- Public visitor endpoints (Visitor & Admin domain) ---

export function searchMedicines(params: PublicMedicineSearchParams = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  query.set("page", String(params.page ?? 1));
  query.set("limit", String(params.limit ?? 20));
  return apiRequest<PaginatedPublicMedicines>(`/medicines?${query.toString()}`, { auth: false });
}

export function getMedicineDetails(id: string) {
  return apiRequest<PublicMedicineResult>(`/medicines/${id}`, { auth: false });
}
