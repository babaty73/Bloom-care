import mongoose from "mongoose";

// Contract: docs/ARCHITECTURE.md §1.2, docs/IMPLEMENTATION_DECISIONS.md (Pharmacy Decisions).
// passwordHash is a technically necessary addition documented in ARCHITECTURE.md — the
// specification requires pharmacy registration/login but lists no credential field.

const pharmacySchema = new mongoose.Schema(
  {
    pharmacyName: {
      type: String,
      required: [true, "pharmacyName is required"],
      trim: true,
      maxlength: [200, "pharmacyName must be at most 200 characters"],
    },
    address: {
      type: String,
      required: [true, "address is required"],
      trim: true,
      maxlength: [300, "address must be at most 300 characters"],
    },
    phone: {
      type: String,
      required: [true, "phone is required"],
      trim: true,
      maxlength: [30, "phone must be at most 30 characters"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email must be a valid email address"],
    },
    passwordHash: {
      type: String,
      required: [true, "passwordHash is required"],
      select: false,
    },
    googleMapsLink: {
      type: String,
      required: [true, "googleMapsLink is required"],
      trim: true,
      // Real Google Maps URLs (even unshortened, query-heavy ones) are well
      // under this; bounds unbounded/abusive input rather than constraining
      // legitimate links.
      maxlength: [2000, "googleMapsLink must be at most 2000 characters"],
    },
    openingTime: {
      type: String,
      required: [true, "openingTime is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "openingTime must be in HH:mm 24-hour format"],
    },
    closingTime: {
      type: String,
      required: [true, "closingTime is required"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "closingTime must be in HH:mm 24-hour format"],
    },
    logo: {
      type: String,
      required: false,
      default: null,
    },
    status: {
      // Technically necessary addition for admin moderation (suspend/ban) explicitly
      // required by the specification's Admin Responsibilities. Not part of the
      // pending "distance/notification/etc." decisions — this is core admin moderation.
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "BANNED"],
      default: "ACTIVE",
    },
    // Pharmacy Verification (production-hardening addition — public registration
    // was allowing anyone to claim to be a pharmacy and immediately become
    // publicly visible). Deliberately a SEPARATE field from `status` above.
    // A pharmacy is operational/public ONLY when status === "ACTIVE" AND
    // verificationStatus === "APPROVED" (see requireActivePharmacy middleware,
    // auth.service.js loginPharmacy, and the public-facing queries in
    // medicine.service.js / pharmacy.service.js, all of which enforce this).
    // PENDING/REJECTED pharmacies cannot log in or use any operational API.
    verificationStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    // Non-sensitive lookup code (e.g. "BC-7F4K92") shown to an applicant at
    // registration so they can check their status without an operational
    // session (which registration deliberately no longer grants — see
    // auth.service.js). Looked up together with the registration email; never
    // exposes the pharmacy's MongoDB _id or any other field.
    applicationReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseNumber: {
      // No format is validated beyond presence and a length bound — the
      // specification/docs do not define a license-number format for any
      // jurisdiction, and inventing one (e.g. an Ethiopian-specific pattern)
      // was explicitly out of scope for this task.
      //
      // NOT schema-`required`: Mongoose re-runs `required` validators on
      // every `.save()`, not just on creation. Making this schema-required
      // would break any pre-existing pharmacy document that predates this
      // field the moment an unrelated update (e.g. an admin status change)
      // calls `.save()` on it. "Required at registration" is instead
      // enforced purely in validate.middleware.js (validatePharmacyRegister),
      // which only runs on the registration route.
      type: String,
      required: false,
      trim: true,
      maxlength: [100, "licenseNumber must be at most 100 characters"],
      default: null,
    },
    // Cloudinary License-Document Decision (docs/IMPLEMENTATION_DECISIONS.md) —
    // replaces the old plumbing-only `licenseDocumentUrl` placeholder now that
    // Cloudinary storage is finalized/DECIDED. Stores just enough to both
    // generate a signed admin-only viewing URL on demand (publicId,
    // resourceType, format) and to delete the asset later (publicId) —
    // deliberately NOT the raw secureUrl-as-a-working-link, since the asset is
    // uploaded with Cloudinary `type: "authenticated"` and has no working
    // public URL anyway; secureUrl is kept only for logging/debugging
    // reference, never served directly to any client.
    //
    // Same "not schema-required" reasoning as licenseNumber above — enforced
    // at the registration route only (validate.middleware.js /
    // auth.service.js), not via Mongoose `required`, so it never breaks
    // `.save()` on a pharmacy document created before this field existed.
    licenseDocument: {
      type: new mongoose.Schema(
        {
          publicId: { type: String, required: true },
          secureUrl: { type: String, required: true },
          resourceType: { type: String, required: true },
          format: { type: String, required: true },
          originalFilename: { type: String, required: false, default: null },
        },
        { _id: false },
      ),
      required: false,
      default: null,
    },
    // Nearby Pharmacy / Distance decision (docs/IMPLEMENTATION_DECISIONS.md
    // Distance Decision): resolved internally from googleMapsLink via Geoapify
    // (see utils/googleMaps.js). NEVER a user-entered field — no manual
    // latitude/longitude input exists anywhere in the pharmacy forms. Never
    // exposed in public/own-profile API responses; used only for server-side
    // distance calculation. null until resolution succeeds at least once.
    location: {
      type: new mongoose.Schema(
        {
          latitude: { type: Number, required: true, min: -90, max: 90 },
          longitude: { type: Number, required: true, min: -180, max: 180 },
        },
        { _id: false },
      ),
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

pharmacySchema.pre("validate", function enforceDistinctHours(next) {
  if (this.openingTime && this.closingTime && this.openingTime === this.closingTime) {
    this.invalidate("closingTime", "closingTime must not equal openingTime");
  }
  next();
});

const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);

export default Pharmacy;
