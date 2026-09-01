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
    },
    genericName: {
      type: String,
      required: [true, "genericName is required"],
      trim: true,
    },
    brandName: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      default: null,
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
