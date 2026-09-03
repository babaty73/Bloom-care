// Contract: docs/ARCHITECTURE.md §17 Notification Rule, docs/IMPLEMENTATION_DECISIONS.md.
//
// This is a provider-independent abstraction boundary ONLY. Notification delivery
// (email/SMS/push, and which provider) is PENDING CONFIRMATION and is NOT decided
// or implemented here. Callers (e.g. expiration.service.js) should depend only on
// this module's exported functions, never on a delivery mechanism directly.
//
// Until the delivery decision is made, these functions intentionally do not send
// anything. They record intent (so the request is observable/debuggable) and
// resolve successfully, so callers can treat "notification requested" as complete
// without knowing or caring how (or whether yet) delivery happens.

/**
 * Request that a pharmacy be notified that one of its medicine listings expired.
 * @param {string} pharmacyId
 * @param {{ _id: string, medicineName: string, expirationDate: Date }} medicine
 */
export async function notifyPharmacyMedicineExpired(pharmacyId, medicine) {
  // PENDING: delivery provider/channel not yet decided (see docs/ARCHITECTURE.md §17).
  console.log(
    `[notification] pharmacy notification requested: pharmacyId=${pharmacyId} ` +
      `medicineId=${medicine._id} medicineName="${medicine.medicineName}" ` +
      `expirationDate=${medicine.expirationDate?.toISOString?.() ?? medicine.expirationDate}`,
  );
}

/**
 * Request that platform admins be notified that a medicine listing expired.
 * @param {{ _id: string, pharmacyId: string, medicineName: string, expirationDate: Date }} medicine
 */
export async function notifyAdminMedicineExpired(medicine) {
  // PENDING: delivery provider/channel not yet decided (see docs/ARCHITECTURE.md §17).
  console.log(
    `[notification] admin notification requested: medicineId=${medicine._id} ` +
      `pharmacyId=${medicine.pharmacyId} medicineName="${medicine.medicineName}" ` +
      `expirationDate=${medicine.expirationDate?.toISOString?.() ?? medicine.expirationDate}`,
  );
}
