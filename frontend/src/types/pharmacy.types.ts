import type { AuthenticatedPharmacy } from "./auth.types";

export type Pharmacy = AuthenticatedPharmacy;

// Public (unauthenticated) pharmacy response shape. Contract: docs/IMPLEMENTATION_DECISIONS.md
// §7 "Public vs private pharmacy fields" — email is never included here, unlike the
// pharmacy's own private profile (Pharmacy, above).
export type PublicPharmacyProfile = Omit<Pharmacy, "email">;

// Nearby Pharmacy / Distance decision — location-resolution feedback (Domain 4).
// Only the pharmacy's own profile views (GET/PATCH /pharmacies/me) include this
// boolean; it is never present on the public/visitor-facing PublicPharmacyProfile,
// and raw coordinates are never exposed anywhere in the API.
export interface OwnPharmacyProfile extends Pharmacy {
  locationResolved: boolean;
}

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
  reportsCount: number;
  recentlyUpdated: Array<{
    _id: string;
    medicineName: string;
    quantity: number;
    inStock: boolean;
    lastUpdated: string;
  }>;
}
