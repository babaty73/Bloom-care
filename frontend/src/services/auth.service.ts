import { apiRequest, apiRequestMultipart } from "../utils/api";
import type {
  PharmacyLoginResponse,
  AdminLoginResponse,
  PharmacyRegisterPayload,
  PharmacyRegistrationResult,
  PharmacyLoginPayload,
  AdminLoginPayload,
} from "../types/auth.types";

// Cloudinary License-Document Decision: registration now sends
// multipart/form-data (text fields + the license document file) instead of
// JSON, so it uses apiRequestMultipart rather than apiRequest.
export function registerPharmacy(payload: PharmacyRegisterPayload) {
  const formData = new FormData();
  formData.append("pharmacyName", payload.pharmacyName);
  formData.append("address", payload.address);
  formData.append("phone", payload.phone);
  formData.append("email", payload.email);
  formData.append("password", payload.password);
  formData.append("googleMapsLink", payload.googleMapsLink);
  formData.append("openingTime", payload.openingTime);
  formData.append("closingTime", payload.closingTime);
  formData.append("licenseNumber", payload.licenseNumber);
  formData.append("licenseDocument", payload.licenseDocument);

  return apiRequestMultipart<PharmacyRegistrationResult>("/auth/pharmacy/register", formData);
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
