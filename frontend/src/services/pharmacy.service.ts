import { apiRequest } from "../utils/api";
import type {
  PublicPharmacyProfile,
  OwnPharmacyProfile,
  PharmacyProfileUpdatePayload,
  PharmacyDashboard,
} from "../types/pharmacy.types";

export function getPharmacyById(id: string) {
  return apiRequest<PublicPharmacyProfile>(`/pharmacies/${id}`, { auth: false });
}

export function getOwnProfile() {
  return apiRequest<OwnPharmacyProfile>("/pharmacies/me");
}

export function updateOwnProfile(payload: PharmacyProfileUpdatePayload) {
  return apiRequest<OwnPharmacyProfile>("/pharmacies/me", { method: "PATCH", body: payload });
}

export function getOwnDashboard() {
  return apiRequest<PharmacyDashboard>("/pharmacies/me/dashboard");
}
