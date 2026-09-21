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
  // Pharmacy Verification — gates both login and public visibility. A
  // pharmacy that successfully authenticates always has verificationStatus
  // "APPROVED" (PENDING/REJECTED are blocked at login and at every subsequent
  // authenticated request — see requireActivePharmacy on the backend). Kept
  // on this type for accuracy/completeness, not because it varies here.
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

// Pharmacy Verification: registration creates a PENDING application, not an
// operational session — no token, no pharmacy profile. Only a non-sensitive
// reference the applicant can use later at the application-status lookup.
export interface PharmacyRegistrationResult {
  applicationReference: string;
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

export interface ApplicationStatusLookupPayload {
  applicationReference: string;
  email: string;
}

export interface ApplicationStatusResult {
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
}

export interface PharmacyLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}
