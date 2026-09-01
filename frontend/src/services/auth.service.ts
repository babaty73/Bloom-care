import { apiRequest } from "../utils/api";
import type {
  PharmacyLoginResponse,
  AdminLoginResponse,
  PharmacyRegisterPayload,
  PharmacyLoginPayload,
  AdminLoginPayload,
} from "../types/auth.types";

export function registerPharmacy(payload: PharmacyRegisterPayload) {
  return apiRequest<PharmacyLoginResponse>("/auth/pharmacy/register", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function loginPharmacy(payload: PharmacyLoginPayload) {
  return apiRequest<PharmacyLoginResponse>("/auth/pharmacy/login", {
    method: "POST",
    body: payload,
    auth: false,
  });
}

export function loginAdmin(payload: AdminLoginPayload) {
  return apiRequest<AdminLoginResponse>("/auth/admin/login", {
    method: "POST",
    body: payload,
    auth: false,
  });
}
