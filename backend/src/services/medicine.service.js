import Medicine from "../models/Medicine.js";
import { ApiError } from "../utils/apiResponse.js";

// NOTE: This file is shared with the medicine-search domain (public GET /api/medicines,
// GET /api/medicines/:id). Only pharmacy-owned CRUD + listing functions are implemented
// here (Auth & Pharmacy domain scope). Public search functions should be added
// alongside these, not in place of them.

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
