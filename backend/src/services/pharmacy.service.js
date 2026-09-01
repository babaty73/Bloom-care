import Pharmacy from "../models/Pharmacy.js";
import Medicine from "../models/Medicine.js";
import { ApiError } from "../utils/apiResponse.js";
import { isPharmacyOpen } from "../utils/pharmacyStatus.js";

// NOTE: Dashboard reports count (spec: "Reports submitted by users") is intentionally
// omitted here — the Report model/domain belongs to the Reports+Admin domain and is
// not yet implemented. Wire it in alongside that domain's work.

function toPublicPharmacy(pharmacyDoc) {
  const pharmacy = pharmacyDoc.toObject ? pharmacyDoc.toObject() : pharmacyDoc;
  delete pharmacy.passwordHash;
  return {
    ...pharmacy,
    isOpen: isPharmacyOpen(pharmacy.openingTime, pharmacy.closingTime),
  };
}

export async function getPharmacyById(pharmacyId) {
  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "Pharmacy not found");
  }
  return toPublicPharmacy(pharmacy);
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
  const [totalMedicines, inStockCount, outOfStockCount, recentlyUpdated] = await Promise.all([
    Medicine.countDocuments({ pharmacyId }),
    Medicine.countDocuments({ pharmacyId, inStock: true }),
    Medicine.countDocuments({ pharmacyId, inStock: false }),
    Medicine.find({ pharmacyId }).sort({ lastUpdated: -1 }).limit(5),
  ]);

  return {
    totalMedicines,
    inStockCount,
    outOfStockCount,
    recentlyUpdated,
  };
}
