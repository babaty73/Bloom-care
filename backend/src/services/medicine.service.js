import Medicine from "../models/Medicine.js";
import Pharmacy from "../models/Pharmacy.js";
import { ApiError } from "../utils/apiResponse.js";
import { isPharmacyOpen } from "../utils/pharmacyStatus.js";
import { isExpired, getPublicVisibilityFilter } from "./expiration.service.js";
import { calculateDistanceKm } from "../utils/distance.js";

// NOTE: This file is shared between the Auth & Pharmacy domain (pharmacy-owned CRUD,
// above) and the Visitor & Admin domain (public search/details, below). Each side
// appends its own functions here rather than replacing the other's.

function computeInStock(quantity) {
  return quantity > 0;
}

async function getOwnedMedicineOrThrow(pharmacyId, medicineId) {
  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Medicine not found");
  }
  if (medicine.pharmacyId.toString() !== pharmacyId.toString()) {
    throw new ApiError(403, "FORBIDDEN", "You do not own this medicine listing");
  }
  return medicine;
}

export async function createMedicineForPharmacy(pharmacyId, data) {
  const { medicineName, genericName, brandName, description, category, price, quantity, expirationDate } = data;

  // Contract: docs/ARCHITECTURE.md §1.3 — "Referenced pharmacy must exist when
  // creating/updating a listing." (Production hardening fix: this was
  // previously unchecked, allowing an orphaned Medicine to be created if the
  // pharmacy account no longer exists.)
  const pharmacy = await Pharmacy.findById(pharmacyId, "_id");
  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }

  if (quantity < 0) {
    throw new ApiError(400, "INVALID_QUANTITY", "quantity must not be negative");
  }

  // expirationDate is required (docs/IMPLEMENTATION_DECISIONS.md Medicine
  // Decision #4) and is now enforced by validateMedicineCreate before this
  // service function is ever called — passed through as-is rather than
  // silently substituting null on omission.
  const medicine = await Medicine.create({
    pharmacyId,
    medicineName,
    genericName,
    brandName: brandName ?? null,
    description: description ?? null,
    category: category ?? null,
    price,
    quantity,
    inStock: computeInStock(quantity),
    lastUpdated: new Date(),
    expirationDate,
  });

  return medicine;
}

export async function updateMedicineForPharmacy(pharmacyId, medicineId, updates) {
  const medicine = await getOwnedMedicineOrThrow(pharmacyId, medicineId);

  const editableFields = [
    "medicineName",
    "genericName",
    "brandName",
    "description",
    "category",
    "price",
    "quantity",
    "expirationDate",
  ];

  for (const field of editableFields) {
    if (updates[field] !== undefined) {
      medicine[field] = updates[field];
    }
  }

  if (updates.quantity !== undefined) {
    if (updates.quantity < 0) {
      throw new ApiError(400, "INVALID_QUANTITY", "quantity must not be negative");
    }
    medicine.inStock = computeInStock(updates.quantity);
  }

  medicine.lastUpdated = new Date();

  await medicine.save();
  return medicine;
}

export async function deleteMedicineForPharmacy(pharmacyId, medicineId) {
  const medicine = await getOwnedMedicineOrThrow(pharmacyId, medicineId);
  await medicine.deleteOne();
}

export async function listMedicinesForPharmacy(pharmacyId, { page, limit }) {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Medicine.find({ pharmacyId }).sort({ updatedAt: -1, _id: 1 }).skip(skip).limit(limit),
    Medicine.countDocuments({ pharmacyId }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Public visitor search/details (Visitor & Admin domain)
// Contract: docs/ARCHITECTURE.md §2.2 "Public search contract"; §"Medicine Search
// Contract" / §"Expiration Contract"; docs/IMPLEMENTATION_DECISIONS.md Medicine
// Decisions #6-#11.
// ---------------------------------------------------------------------------

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Only the fields IMPLEMENTATION_DECISIONS.md §11 authorizes for the public
// pharmacy-info block. Deliberately excludes email and passwordHash: email is not
// part of the public pharmacy payload per §7 "Public vs private pharmacy fields",
// and passwordHash must never be exposed.
function toPublicPharmacySummary(pharmacy) {
  if (!pharmacy) return null;
  return {
    _id: pharmacy._id,
    pharmacyName: pharmacy.pharmacyName,
    address: pharmacy.address,
    phone: pharmacy.phone,
    googleMapsLink: pharmacy.googleMapsLink,
    openingTime: pharmacy.openingTime,
    closingTime: pharmacy.closingTime,
    logo: pharmacy.logo,
    isOpen: isPharmacyOpen(pharmacy.openingTime, pharmacy.closingTime),
  };
}

function toPublicMedicine(medicineDoc) {
  const medicine = medicineDoc.toObject ? medicineDoc.toObject() : medicineDoc;
  return {
    _id: medicine._id,
    medicineName: medicine.medicineName,
    genericName: medicine.genericName,
    brandName: medicine.brandName,
    description: medicine.description,
    category: medicine.category,
    price: medicine.price,
    quantity: medicine.quantity,
    inStock: medicine.inStock,
    expirationDate: medicine.expirationDate,
    lastUpdated: medicine.lastUpdated,
    pharmacy: toPublicPharmacySummary(medicine.pharmacyId),
  };
}

// Public pharmacy-selection fields for population. Excludes email/passwordHash;
// includes status only to decide inclusion below, never returned to the client.
// Includes location (Nearby Pharmacy / Distance decision) for internal distance
// calculation only — toPublicPharmacySummary() below never returns it.
const PUBLIC_PHARMACY_POPULATE_FIELDS =
  "pharmacyName address phone googleMapsLink openingTime closingTime logo status location";

/**
 * Public medicine search for visitors.
 * - Excludes listings whose pharmacy is not ACTIVE (suspended/banned pharmacies
 *   must not surface in visitor-facing results — otherwise admin suspension has
 *   no visible effect; this mirrors the already-established Pharmacy.status field).
 * - Excludes expired listings (non-destructive: they remain in the database).
 * - Case-insensitive, whitespace-trimmed, partial match over medicineName/genericName.
 * - Ordering: in-stock first, then lower price, then most-recently-updated, then _id.
 *
 * Nearby Pharmacy / Distance decision: when the caller supplies visitor
 * `latitude`/`longitude`, each result additionally gets a `distanceKm` field
 * (straight-line distance to that listing's pharmacy; null when the pharmacy's
 * location hasn't been resolved yet), and results are re-ordered nearest-first
 * ahead of the existing tie-break ordering above. When no coordinates are
 * supplied, behavior and response shape are byte-identical to before this
 * feature existed — this is purely additive.
 */
export async function searchPublicMedicines({ search, page, limit, latitude, longitude }) {
  const now = new Date();

  const activePharmacyIds = (await Pharmacy.find({ status: "ACTIVE" }, "_id")).map((p) => p._id);

  const filter = {
    pharmacyId: { $in: activePharmacyIds },
    ...getPublicVisibilityFilter(now),
  };

  const trimmed = typeof search === "string" ? search.trim() : "";
  if (trimmed) {
    const pattern = new RegExp(escapeRegex(trimmed), "i");
    filter.$and = [{ $or: [{ medicineName: pattern }, { genericName: pattern }] }];
  }

  const hasVisitorLocation = typeof latitude === "number" && typeof longitude === "number";

  if (!hasVisitorLocation) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Medicine.find(filter)
        .populate("pharmacyId", PUBLIC_PHARMACY_POPULATE_FIELDS)
        .sort({ inStock: -1, price: 1, lastUpdated: -1, _id: 1 })
        .skip(skip)
        .limit(limit),
      Medicine.countDocuments(filter),
    ]);

    return {
      items: items.map(toPublicMedicine),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // Nearby mode: distance depends on the populated pharmacy's location, which
  // MongoDB cannot sort/paginate by without a geospatial aggregation (out of
  // scope for this decision — no routing/geo query provider, smallest clean
  // integration point). We fetch the full filtered set, compute distance in
  // application code, sort nearest-first, then paginate in memory. The existing
  // tie-break ordering (in-stock, price, lastUpdated, _id) is preserved as a
  // stable secondary order beneath distance.
  const allMatching = await Medicine.find(filter)
    .populate("pharmacyId", PUBLIC_PHARMACY_POPULATE_FIELDS)
    .sort({ inStock: -1, price: 1, lastUpdated: -1, _id: 1 });

  const withDistance = allMatching.map((doc) => {
    const pharmacyLocation = doc.pharmacyId?.location;
    const distanceKm =
      pharmacyLocation && typeof pharmacyLocation.latitude === "number" && typeof pharmacyLocation.longitude === "number"
        ? Math.round(calculateDistanceKm({ latitude, longitude }, pharmacyLocation) * 10) / 10
        : null;
    return { ...toPublicMedicine(doc), distanceKm };
  });

  withDistance.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  const total = withDistance.length;
  const skip = (page - 1) * limit;
  const items = withDistance.slice(skip, skip + limit);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Public medicine details for visitors. Not found / expired / owned by a
 * non-ACTIVE pharmacy all surface identically as 404 so visitors cannot infer
 * moderation state from the response.
 */
export async function getPublicMedicineDetails(medicineId) {
  const now = new Date();

  const medicine = await Medicine.findById(medicineId).populate("pharmacyId", PUBLIC_PHARMACY_POPULATE_FIELDS);

  const medicineExpired = medicine ? isExpired(medicine, now) : false;
  const pharmacyUnavailable = !medicine?.pharmacyId || medicine.pharmacyId.status !== "ACTIVE";

  if (!medicine || medicineExpired || pharmacyUnavailable) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Medicine not found");
  }

  return toPublicMedicine(medicine);
}

// ---------------------------------------------------------------------------
// Admin domain (medicine moderation). Contract: docs/ARCHITECTURE.md §2.5
// "Admin service boundary" — admin.service.js calls these rather than
// duplicating medicine domain logic.
// ---------------------------------------------------------------------------

export async function deleteMedicineById(medicineId) {
  const medicine = await Medicine.findById(medicineId);
  if (!medicine) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Medicine not found");
  }
  await medicine.deleteOne();
}

export async function countAllMedicines() {
  return Medicine.countDocuments({});
}
