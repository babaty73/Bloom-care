import bcrypt from "bcrypt";
import Pharmacy from "../models/Pharmacy.js";
import Admin from "../models/Admin.js";
import config from "../config/env.js";
import { signToken } from "../utils/jwt.js";
import { ApiError } from "../utils/apiResponse.js";
import { resolvePharmacyLocation } from "../utils/googleMaps.js";
import { generateApplicationReferenceCandidate } from "../utils/applicationReference.js";

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

async function generateUniqueApplicationReference() {
  // Six characters from a 32-symbol charset is ~1-in-a-billion collision odds
  // per attempt, but the DB is the actual source of truth — retry on the rare
  // collision rather than trusting probability alone.
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = generateApplicationReferenceCandidate();
    const existing = await Pharmacy.findOne({ applicationReference: candidate }, "_id");
    if (!existing) return candidate;
  }
  throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Could not generate a unique application reference");
}

/**
 * Pharmacy Verification: public registration no longer creates an
 * operational session. It creates a PENDING application and returns only a
 * non-sensitive application reference the applicant can use to check status
 * later (see checkApplicationStatus below) — no token, no pharmacy profile
 * data, nothing that would let the frontend treat this as a successful login.
 */
export async function registerPharmacy({
  pharmacyName,
  address,
  phone,
  email,
  password,
  googleMapsLink,
  openingTime,
  closingTime,
  licenseNumber,
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
  // distance-sorted nearby results once approved and its link resolves.
  let location = null;
  try {
    location = await resolvePharmacyLocation(googleMapsLink);
  } catch (err) {
    console.warn(`[pharmacy location] could not resolve location for new pharmacy: ${err.message}`);
  }

  const applicationReference = await generateUniqueApplicationReference();

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
    licenseNumber,
    verificationStatus: "PENDING",
    applicationReference,
  });

  return { applicationReference: pharmacy.applicationReference };
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

  // Pharmacy Verification: a pharmacy is operational only when
  // verificationStatus === "APPROVED" AND status === "ACTIVE". Checked after
  // credential verification (not before) so a wrong password always yields
  // the same INVALID_CREDENTIALS response regardless of account state,
  // avoiding leaking account-existence/state information to a guesser.
  if (pharmacy.verificationStatus === "PENDING") {
    throw new ApiError(403, "FORBIDDEN", "Your pharmacy application is still awaiting admin review");
  }
  if (pharmacy.verificationStatus === "REJECTED") {
    throw new ApiError(403, "FORBIDDEN", "Your pharmacy application was not approved");
  }
  if (pharmacy.status !== "ACTIVE") {
    throw new ApiError(403, "FORBIDDEN", "This pharmacy account is suspended or banned");
  }

  const token = signToken({ sub: pharmacy._id.toString(), role: "pharmacy" });

  return { token, pharmacy: toPublicPharmacy(pharmacy) };
}

/**
 * Public, unauthenticated application-status lookup. Requires the exact
 * applicationReference + the email used at registration (two factors, so a
 * bare guessed reference alone reveals nothing) and returns ONLY the
 * verificationStatus — no MongoDB _id, no other pharmacy field. A
 * non-matching combination gets the same generic error as a matching-but-
 * wrong-email attempt, so this cannot be used to enumerate which references
 * or emails are real.
 */
export async function checkApplicationStatus({ applicationReference, email }) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedReference = applicationReference.toUpperCase().trim();

  const pharmacy = await Pharmacy.findOne({
    applicationReference: normalizedReference,
    email: normalizedEmail,
  });

  if (!pharmacy) {
    throw new ApiError(404, "RESOURCE_NOT_FOUND", "No matching application was found");
  }

  return { verificationStatus: pharmacy.verificationStatus };
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
