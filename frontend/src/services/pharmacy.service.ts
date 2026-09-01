import { apiRequest } from "../utils/api";
import type { Pharmacy, PharmacyProfileUpdatePayload, PharmacyDashboard } from "../types/pharmacy.types";

export function getPharmacyById(id: string) {
  return apiRequest<Pharmacy>(`/pharmacies/${id}`, { auth: false });
}

export function getOwnProfile() {
  return apiRequest<Pharmacy>("/pharmacies/me");
}

export function updateOwnProfile(payload: PharmacyProfileUpdatePayload) {
  return apiRequest<Pharmacy>("/pharmacies/me", { method: "PATCH", body: payload });
}

export function getOwnDashboard() {
  return apiRequest<PharmacyDashboard>("/pharmacies/me/dashboard");
}
