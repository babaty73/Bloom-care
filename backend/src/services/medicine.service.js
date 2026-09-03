import Medicine from "../models/Medicine.js";
import Pharmacy from "../models/Pharmacy.js";
import { ApiError } from "../utils/apiResponse.js";
import { isPharmacyOpen } from "../utils/pharmacyStatus.js";
import { isExpired, getPublicVisibilityFilter } from "./expiration.service.js";

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

  if (quantity < 0) {
    throw new ApiError(400, "INVALID_QUANTITY", "quantity must not be negative");
  }

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
    expirationDate: expirationDate ?? null,
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
const PUBLIC_PHARMACY_POPULATE_FIELDS =
  "pharmacyName address phone googleMapsLink openingTime closingTime logo status";

/**
 * Public medicine search for visitors.
 * - Excludes listings whose pharmacy is not ACTIVE (suspended/banned pharmacies
 *   must not surface in visitor-facing results — otherwise admin suspension has
 *   no visible effect; this mirrors the already-established Pharmacy.status field).
 * - Excludes expired listings (non-destructive: they remain in the database).
 * - Case-insensitive, whitespace-trimmed, partial match over medicineName/genericName.
 * - Ordering: in-stock first, then lower price, then most-recently-updated, then _id.
 */
export async function searchPublicMedicines({ search, page, limit }) {
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
