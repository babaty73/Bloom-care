// Contract: docs/ARCHITECTURE.md §1.3.
// NOTE: this file only covers what the pharmacy-owned CRUD/management UI needs.
// Public search/detail types belong to the medicine-search domain and can be added
// alongside these.

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
