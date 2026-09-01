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
  pharmacy: AuthenticatedPharmacy;
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
}

export interface PharmacyLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}
