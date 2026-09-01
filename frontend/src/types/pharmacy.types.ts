import type { AuthenticatedPharmacy } from "./auth.types";

export type Pharmacy = AuthenticatedPharmacy;

export interface PharmacyProfileUpdatePayload {
  pharmacyName?: string;
  address?: string;
  phone?: string;
  googleMapsLink?: string;
  openingTime?: string;
  closingTime?: string;
  logo?: string | null;
}

export interface PharmacyDashboard {
  totalMedicines: number;
  inStockCount: number;
  outOfStockCount: number;
  recentlyUpdated: Array<{
    _id: string;
    medicineName: string;
    quantity: number;
    inStock: boolean;
    lastUpdated: string;
  }>;
}
