// Contract: docs/ARCHITECTURE.md Authentication Contract.

export type UserRole = "pharmacy" | "admin";

export interface AuthenticatedPharmacy {
  _id: string;
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  googleMapsLink: string;
  openingTime: string;
  closingTime: string;
  logo: string | null;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  // Pharmacy Verification (production hardening) — gates public visibility
  // only; a PENDING/REJECTED pharmacy can still log in and use its dashboard
  // normally (see backend/src/models/Pharmacy.js for the full rationale).
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  licenseNumber: string;
  // Plumbing-only (see backend/src/models/Pharmacy.js) — always null until a
  // storage provider is decided and an upload flow is built. Not rendered
  // anywhere in the UI yet.
  licenseDocumentUrl: string | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthenticatedAdmin {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface PharmacyLoginResponse {
  token: string;
  pharmacy: AuthenticatedPharmacy & { locationResolved?: boolean };
}

export interface AdminLoginResponse {
  token: string;
  admin: AuthenticatedAdmin;
}

export interface PharmacyRegisterPayload {
  pharmacyName: string;
  address: string;
  phone: string;
  email: string;
  password: string;
  googleMapsLink: string;
  openingTime: string;
  closingTime: string;
  licenseNumber: string;
}

export interface PharmacyLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}
