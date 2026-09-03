// Contract: docs/IMPLEMENTATION_DECISIONS.md Report Decisions §1-§2.
// NOTE: only the visitor-facing submission shape is defined here (Visitor & Admin
// domain, public entry point). Pharmacy/admin report-management types
// (status transitions, filtering) belong alongside the Reports backend work and
// can be added here later without touching this shape.

export type ReportReason =
  | "MEDICINE_NOT_AVAILABLE"
  | "WRONG_PRICE"
  | "WRONG_LOCATION"
  | "PHARMACY_PERMANENTLY_CLOSED"
  | "EXPIRED_MEDICINE"
  | "OTHER";

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  MEDICINE_NOT_AVAILABLE: "Medicine not available",
  WRONG_PRICE: "Wrong price",
  WRONG_LOCATION: "Wrong location",
  PHARMACY_PERMANENTLY_CLOSED: "Pharmacy permanently closed",
  EXPIRED_MEDICINE: "Expired medicine",
  OTHER: "Other",
};

export interface ReportSubmitPayload {
  medicineId: string;
  pharmacyId: string;
  reason: ReportReason;
  additionalComment?: string;
}

export interface ReportSubmitResult {
  _id: string;
  medicineId: string;
  pharmacyId: string;
  reason: ReportReason;
  additionalComment: string | null;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
}
