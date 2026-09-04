// Contract: docs/ARCHITECTURE.md §1.3.
// NOTE: shared between the Auth & Pharmacy domain (pharmacy-owned CRUD types above)
// and the Visitor & Admin domain (public search/detail types below).

export interface Medicine {
  _id: string;
  pharmacyId: string;
  medicineName: string;
  genericName: string;
  brandName: string | null;
  description: string | null;
  category: string | null;
  price: number;
  quantity: number;
  inStock: boolean;
  lastUpdated: string;
  expirationDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineCreatePayload {
  medicineName: string;
  genericName: string;
  brandName?: string;
  description?: string;
  category?: string;
  price: number;
  quantity: number;
  expirationDate?: string;
}

export type MedicineUpdatePayload = Partial<MedicineCreatePayload>;

export interface PaginatedMedicines {
  items: Medicine[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Public visitor search/details (Visitor & Admin domain).
// Contract: docs/IMPLEMENTATION_DECISIONS.md Medicine Decisions §11 "Public
// medicine result" — matches the backend's public medicine + pharmacy shape
// exactly. Deliberately excludes pharmacy email (not part of the public payload
// per §7 "Public vs private pharmacy fields").
// ---------------------------------------------------------------------------

export interface PublicPharmacySummary {
  _id: string;
  pharmacyName: string;
  address: string;
  phone: string;
  googleMapsLink: string;
  openingTime: string;
  closingTime: string;
  logo: string | null;
  isOpen: boolean;
}

export interface PublicMedicineResult {
  _id: string;
  medicineName: string;
  genericName: string;
  brandName: string | null;
  description: string | null;
  category: string | null;
  price: number;
  quantity: number;
  inStock: boolean;
  expirationDate: string | null;
  lastUpdated: string;
  pharmacy: PublicPharmacySummary | null;
  // Nearby Pharmacy / Distance decision: present only when the search request
  // included visitor coordinates. null means the pharmacy's location hasn't
  // been resolved yet.
  distanceKm?: number | null;
}

export interface PublicMedicineSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  // Nearby Pharmacy / Distance decision: from the browser Geolocation API only,
  // requested when the visitor asks for nearby/distance functionality. Never
  // persisted — kept in component state only.
  latitude?: number;
  longitude?: number;
}

export interface PaginatedPublicMedicines {
  items: PublicMedicineResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
