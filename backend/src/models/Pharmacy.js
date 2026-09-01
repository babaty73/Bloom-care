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
    },
    address: {
      type: String,
      required: [true, "address is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "phone is required"],
      trim: true,
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
