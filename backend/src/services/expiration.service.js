import Medicine from "../models/Medicine.js";
import * as notificationService from "./notification.service.js";

// Contract: docs/ARCHITECTURE.md §13 Expiration Contract, §17 Notification Rule,
// §18 Expiration Scheduling Rule, Project Specification "Automatic Availability
// Management".
//
// Expiration is non-destructive: expired records are never deleted, only excluded
// from public visibility. This module is the sole owner of "is this medicine
// expired / publicly visible" logic — other domains should call into it rather
// than re-implementing the check.
//
// CRITICAL: this file intentionally does NOT schedule itself. The execution
// mechanism (cron/worker/queue/etc.) is PENDING CONFIRMATION (see §18). Nothing
// in this codebase currently calls processExpiredMedicines() automatically — it
// exists so that whichever mechanism is eventually approved has something to call.

/**
 * Whether a single medicine listing is expired as of `now`.
 * A medicine with no expirationDate never expires.
 * @param {{ expirationDate: Date | string | null }} medicine
 * @param {Date} [now]
 */
export function isExpired(medicine, now = new Date()) {
  if (!medicine.expirationDate) return false;
  return new Date(medicine.expirationDate).getTime() <= now.getTime();
}

/**
 * Mongo filter fragment that matches medicines which are NOT expired
 * (i.e. safe to show publicly). Intended to be merged into whatever query the
 * public search/detail domain builds — e.g.:
 *
 *   Medicine.find({ ...searchCriteria, ...getPublicVisibilityFilter() })
 *
 * This is the single source of truth for the expiration part of "public
 * exclusion" so search and detail endpoints stay consistent with each other
 * and with this service's own isExpired() check.
 * @param {Date} [now]
 */
export function getPublicVisibilityFilter(now = new Date()) {
  return {
    $or: [{ expirationDate: null }, { expirationDate: { $gt: now } }],
  };
}

/**
 * Performs expiration processing: finds medicine listings that have expired
 * and have not yet had a notification requested for them, requests pharmacy +
 * admin notification via the provider-independent notification.service.js
 * abstraction, and records that the request was made (so re-running this
 * function is safe and won't re-notify for the same listing).
 *
 * This function does NOT delete or otherwise mutate the medicine's stored data
 * beyond the notification bookkeeping field — expired listings remain in
 * MongoDB and remain excluded from public visibility purely via
 * getPublicVisibilityFilter(), independent of whether this function has run.
 *
 * NOTHING in this codebase calls this function automatically. The scheduling
 * mechanism is PENDING CONFIRMATION (docs/ARCHITECTURE.md §18) — this is
 * exposed for a future scheduler/worker/manual trigger to call once that
 * decision is made.
 *
 * @param {Date} [now]
 * @returns {Promise<{ processedCount: number, medicineIds: string[] }>}
 */
export async function processExpiredMedicines(now = new Date()) {
  const candidates = await Medicine.find({
    expirationDate: { $ne: null, $lte: now },
    notifiedExpiredAt: null,
  });

  const medicineIds = [];

  for (const medicine of candidates) {
    await notificationService.notifyPharmacyMedicineExpired(medicine.pharmacyId.toString(), medicine);
    await notificationService.notifyAdminMedicineExpired(medicine);

    medicine.notifiedExpiredAt = now;
    await medicine.save();

    medicineIds.push(medicine._id.toString());
  }

  return { processedCount: medicineIds.length, medicineIds };
}
