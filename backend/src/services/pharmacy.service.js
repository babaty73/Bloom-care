import Pharmacy from "../models/Pharmacy.js";
import Medicine from "../models/Medicine.js";
import Report from "../models/Report.js";
import { ApiError } from "../utils/apiResponse.js";
import { isPharmacyOpen } from "../utils/pharmacyStatus.js";

function toPublicPharmacy(pharmacyDoc) {
  const pharmacy = pharmacyDoc.toObject ? pharmacyDoc.toObject() : pharmacyDoc;
  delete pharmacy.passwordHash;
  return {
    ...pharmacy,
    isOpen: isPharmacyOpen(pharmacy.openingTime, pharmacy.closingTime),
  };
}

// Contract: docs/IMPLEMENTATION_DECISIONS.md §7 "Public vs private pharmacy
// fields" — the pharmacy email is not part of the ordinary public pharmacy-result
// payload. toPublicPharmacy() above is used for the pharmacy's OWN profile views
// (GET /pharmacies/me, PATCH /pharmacies/me), where the pharmacy legitimately sees
// its own email, so it is left as-is. This serializer is for the truly public,
// unauthenticated visitor-facing endpoint only.
function toVisitorPharmacy(pharmacyDoc) {
  const pharmacy = toPublicPharmacy(pharmacyDoc);
  delete pharmacy.email;
  return pharmacy;
}

export async function getPharmacyById(pharmacyId) {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  // Suspended/banned pharmacies must not be visitor-visible, otherwise admin
  // suspension/ban has no visible effect. Reported as RESOURCE_NOT_FOUND rather
  // than a distinct status so visitors can't infer moderation state.
  if (!pharmacy || pharmacy.status !== "ACTIVE") {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }
  return toVisitorPharmacy(pharmacy);
}

export async function getOwnProfile(pharmacyId) {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }
  return toPublicPharmacy(pharmacy);
}

export async function updateOwnProfile(pharmacyId, updates) {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }

  const editableFields = ["pharmacyName", "address", "phone", "googleMapsLink", "openingTime", "closingTime", "logo"];
  for (const field of editableFields) {
    if (updates[field] !== undefined) {
      pharmacy[field] = updates[field];
    }
  }

  await pharmacy.save();
  return toPublicPharmacy(pharmacy);
}

export async function getOwnDashboard(pharmacyId) {
  const [totalMedicines, inStockCount, outOfStockCount, recentlyUpdated, reportsCount] = await Promise.all([
    Medicine.countDocuments({ pharmacyId }),
    Medicine.countDocuments({ pharmacyId, inStock: true }),
    Medicine.countDocuments({ pharmacyId, inStock: false }),
    Medicine.find({ pharmacyId }).sort({ lastUpdated: -1 }).limit(5),
    Report.countDocuments({ pharmacyId }),
  ]);

  return {
    totalMedicines,
    inStockCount,
    outOfStockCount,
    reportsCount,
    recentlyUpdated,
  };
}

// ---------------------------------------------------------------------------
// Admin domain (pharmacy management). Contract: docs/ARCHITECTURE.md §2.5
// "Admin service boundary" — admin.service.js orchestrates by calling these
// rather than duplicating pharmacy domain logic.
// ---------------------------------------------------------------------------

export async function listPharmaciesForAdmin({ status }, { page, limit }) {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Pharmacy.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Pharmacy.countDocuments(filter),
  ]);

  return {
    items: items.map(toPublicPharmacy),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function updatePharmacyStatus(pharmacyId, status) {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }
  pharmacy.status = status;
  await pharmacy.save();
  return toPublicPharmacy(pharmacy);
}

/**
 * Intentionally non-cascading: associated Medicine documents are left in place,
 * mirroring the "expiration is non-destructive" precedent. Public search/details
 * already exclude medicines whose pharmacy is missing or not ACTIVE, so orphaned
 * medicines never surface to visitors regardless of this choice.
 */
export async function deletePharmacyById(pharmacyId) {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }
  await pharmacy.deleteOne();
}

export async function countPharmaciesByStatus() {
  const [total, active, suspended, banned] = await Promise.all([
    Pharmacy.countDocuments({}),
    Pharmacy.countDocuments({ status: "ACTIVE" }),
    Pharmacy.countDocuments({ status: "SUSPENDED" }),
    Pharmacy.countDocuments({ status: "BANNED" }),
  ]);
  return { total, active, suspended, banned };
}
