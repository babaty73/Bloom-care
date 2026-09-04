import bcrypt from "bcrypt";
import Pharmacy from "../models/Pharmacy.js";
import Admin from "../models/Admin.js";
import config from "../config/env.js";
import { signToken } from "../utils/jwt.js";
import { ApiError } from "../utils/apiResponse.js";
import { resolvePharmacyLocation } from "../utils/googleMaps.js";

// Contract: docs/ARCHITECTURE.md Authentication Contract, docs/IMPLEMENTATION_DECISIONS.md.
// bcrypt work factor 12. JWT payload is exactly { sub, role }. No refresh tokens.

function toPublicPharmacy(pharmacyDoc) {
  const pharmacy = pharmacyDoc.toObject ? pharmacyDoc.toObject() : pharmacyDoc;
  delete pharmacy.passwordHash;
  // location is internal-only (Nearby Pharmacy / Distance decision) — never
  // exposed in API responses, including to the pharmacy itself.
  delete pharmacy.location;
  return pharmacy;
}

export async function registerPharmacy({
  pharmacyName,
  address,
  phone,
  email,
  password,
  googleMapsLink,
  openingTime,
  closingTime,
}) {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await Pharmacy.findOne({ email: normalizedEmail });
  if (existing) {
    throw new ApiError(409, "DUPLICATE_EMAIL", "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

  // Nearby Pharmacy / Distance decision: resolve the Google Maps link to
  // latitude/longitude on create. Best-effort and non-blocking — registration
  // must not fail because an external geocoding service is unavailable or the
  // link happens to be unresolvable; the pharmacy is simply excluded from
  // distance-sorted nearby results until its link resolves successfully. See
  // this task's final report for confirmation on whether this should instead
  // be a hard failure.
  let location = null;
  try {
    location = await resolvePharmacyLocation(googleMapsLink);
  } catch (err) {
    console.warn(`[pharmacy location] could not resolve location for new pharmacy (${email}): ${err.message}`);
  }

  const pharmacy = await Pharmacy.create({
    pharmacyName,
    address,
    phone,
    email: normalizedEmail,
    passwordHash,
    googleMapsLink,
    openingTime,
    closingTime,
    location,
  });

  const token = signToken({ sub: pharmacy._id.toString(), role: "pharmacy" });

  return { token, pharmacy: toPublicPharmacy(pharmacy) };
}

export async function loginPharmacy({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const pharmacy = await Pharmacy.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!pharmacy) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, pharmacy.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const token = signToken({ sub: pharmacy._id.toString(), role: "pharmacy" });

  return { token, pharmacy: toPublicPharmacy(pharmacy) };
}

export async function loginAdmin({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const admin = await Admin.findOne({ email: normalizedEmail }).select("+password");
  if (!admin) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, admin.password);
  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  const token = signToken({ sub: admin._id.toString(), role: "admin" });

  const adminObj = admin.toObject();
  delete adminObj.password;

  return { token, admin: adminObj };
}
