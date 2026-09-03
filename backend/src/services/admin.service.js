import * as pharmacyService from "./pharmacy.service.js";
import * as medicineService from "./medicine.service.js";
import * as reportService from "./report.service.js";

// Contract: docs/ARCHITECTURE.md §2.5 "Admin service boundary" — admin endpoints
// must not duplicate medicine/pharmacy/report domain logic; this file only
// orchestrates calls to those domain services.

export async function getDashboardStats() {
  const [pharmacies, totalMedicines, reports] = await Promise.all([
    pharmacyService.countPharmaciesByStatus(),
    medicineService.countAllMedicines(),
    reportService.countReportsByStatus(),
  ]);

  return { pharmacies, totalMedicines, reports };
}

export async function listPharmacies(filters, pagination) {
  return pharmacyService.listPharmaciesForAdmin(filters, pagination);
}

export async function updatePharmacyStatus(pharmacyId, status) {
  return pharmacyService.updatePharmacyStatus(pharmacyId, status);
}

export async function deletePharmacy(pharmacyId) {
  return pharmacyService.deletePharmacyById(pharmacyId);
}

export async function deleteMedicine(medicineId) {
  return medicineService.deleteMedicineById(medicineId);
}

export async function listReports(filters, pagination) {
  return reportService.listReportsForAdmin(filters, pagination);
}

export async function reviewReport(reportId, status) {
  return reportService.updateReportStatus(reportId, status);
}
