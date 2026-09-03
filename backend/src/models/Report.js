import mongoose from "mongoose";

// Contract: docs/ARCHITECTURE.md §1.4, docs/IMPLEMENTATION_DECISIONS.md Report
// Decisions §1-§3. Report retains both medicineId and pharmacyId because both are
// explicitly specified; the service layer (report.service.js) is authoritative for
// verifying medicine.pharmacyId === pharmacyId before a report is accepted.

export const REPORT_REASON_VALUES = [
  "MEDICINE_NOT_AVAILABLE",
  "WRONG_PRICE",
  "WRONG_LOCATION",
  "PHARMACY_PERMANENTLY_CLOSED",
  "EXPIRED_MEDICINE",
  "OTHER",
];

export const REPORT_STATUS_VALUES = ["PENDING", "RESOLVED", "REJECTED"];

const reportSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: [true, "medicineId is required"],
      index: true,
    },
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: [true, "pharmacyId is required"],
      index: true,
    },
    reason: {
      type: String,
      required: [true, "reason is required"],
      enum: { values: REPORT_REASON_VALUES, message: "reason must be a valid report reason" },
    },
    additionalComment: {
      type: String,
      required: false,
      trim: true,
      maxlength: [500, "additionalComment must be at most 500 characters"],
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: { values: REPORT_STATUS_VALUES, message: "status must be a valid report status" },
      default: "PENDING",
      index: true,
    },
  },
  // Spec's Database Structure lists only `createdAt` for Report (no updatedAt).
  { timestamps: { createdAt: true, updatedAt: false } },
);

const Report = mongoose.model("Report", reportSchema);

export default Report;
