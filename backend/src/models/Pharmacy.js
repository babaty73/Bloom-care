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
      type: String,
      required: [true, "licenseNumber is required"],
      trim: true,
      maxlength: [100, "licenseNumber must be at most 100 characters"],
    },
    // Plumbing-only reference field, deliberately mirroring `logo` above: the
    // Logo/Storage Decision remains PENDING CONFIRMATION project-wide, and that
    // decision blocks selecting a storage provider for THIS field too (a
    // license document has the exact same "where do we put the file" problem
    // as a logo). No upload endpoint or storage integration exists anywhere in
    // this codebase for this field — nothing currently sets it. It exists so
    // that whichever storage mechanism gets agreed on later has a field to
    // write the resulting reference into, without a schema migration at that
    // point.
    licenseDocumentUrl: {
      type: String,
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
