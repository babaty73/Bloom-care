import mongoose from "mongoose";

// Contract: docs/ARCHITECTURE.md §1.3, docs/IMPLEMENTATION_DECISIONS.md (Medicine Decisions).
// A Medicine is a pharmacy-specific inventory listing — NOT a global catalog entry.
// The service layer (medicine.service.js) is authoritative for the
// quantity/inStock invariant; this schema only enforces field-level shape.

const medicineSchema = new mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: [true, "pharmacyId is required"],
      index: true,
    },
    medicineName: {
      type: String,
      required: [true, "medicineName is required"],
      trim: true,
      // Production-hardening: bound free-text length (matches the pattern
      // already established for Report.additionalComment). No legitimate
      // medicine name approaches this; it only guards against abuse/storage
      // bloat and UI breakage from unbounded input.
      maxlength: [200, "medicineName must be at most 200 characters"],
    },
    genericName: {
      type: String,
      required: [true, "genericName is required"],
      trim: true,
      maxlength: [200, "genericName must be at most 200 characters"],
    },
    brandName: {
      type: String,
      required: false,
      trim: true,
      default: null,
      maxlength: [200, "brandName must be at most 200 characters"],
    },
    description: {
      // Contract: docs/ARCHITECTURE.md §1.3 — "Must contain the medicine
      // description required by the specification." Required (this was
      // previously required: false, contradicting the documented contract —
      // production-readiness audit finding, fixed here).
      type: String,
      required: [true, "description is required"],
      trim: true,
      maxlength: [2000, "description must be at most 2000 characters"],
    },
    category: {
      // Contract: docs/ARCHITECTURE.md §1.3 — "Must be non-empty." Required
      // (same fix as description above).
      type: String,
      required: [true, "category is required"],
      trim: true,
      maxlength: [100, "category must be at most 100 characters"],
    },
    price: {
      type: Number,
      required: [true, "price is required"],
      min: [0, "price must not be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "quantity is required"],
      min: [0, "quantity must not be negative"],
    },
    inStock: {
      type: Boolean,
      required: true,
      default: false,
    },
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expirationDate: {
      type: Date,
      required: true,
      default: null,
    },
    // Technically necessary addition for the Expiration domain (not a new product
    // field): records when an expiration notification was last requested for this
    // listing, so repeated expiration-processing runs don't re-request notification
    // for the same already-expired listing every time. Delivery itself remains
    // PENDING CONFIRMATION (see notification.service.js) — this only tracks whether
    // a request was already made.
    notifiedExpiredAt: {
      type: Date,
      required: false,
      default: null,
    },
  },
  { timestamps: true },
);

// Note: no search index is defined here. The public search strategy
// (regex vs. text index, etc.) belongs to the medicine-search domain and is
// left for that implementation to decide.

const Medicine = mongoose.model("Medicine", medicineSchema);

export default Medicine;
