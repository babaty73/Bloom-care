import { apiRequest } from "../utils/api";
import type { Medicine, MedicineCreatePayload, MedicineUpdatePayload, PaginatedMedicines } from "../types/medicine.types";

// NOTE: this file is shared with the medicine-search domain (public search/detail
// calls). Only the pharmacy-owned CRUD/listing calls are implemented here.

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
