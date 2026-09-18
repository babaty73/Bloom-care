import "dotenv/config";
import mongoose from "mongoose";
import Pharmacy from "../models/Pharmacy.js";
import config from "../config/env.js";

// Pharmacy Verification (production hardening) added `verificationStatus`
// (default "PENDING") and required `licenseNumber` to the Pharmacy schema.
// Mongoose defaults only apply to newly-created documents — they do NOT
// retroactively add the field to pharmacies that already existed in the
// database before this change. Without this one-off backfill, every
// pre-existing pharmacy would have no `verificationStatus` field at all,
// which would NOT match the new `{ verificationStatus: "APPROVED" }` public-
// visibility filter — meaning every pharmacy that was already operating
// would instantly vanish from public search/details the moment this deploys.
//
// This grandfathers pre-existing pharmacies in as APPROVED (they were already
// operating normally under the old model, so treating them as pre-approved is
// the non-disruptive choice) rather than silently taking the whole platform's
// existing pharmacies offline.
//
// One-off, manually run — not a scheduler (mirrors the existing
// resolveExistingPharmacyLocations.js precedent exactly).

async function backfillPharmacyVerificationStatus() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB.");

    const result = await Pharmacy.updateMany(
      { verificationStatus: { $exists: false } },
      { $set: { verificationStatus: "APPROVED" } },
    );

    console.log(`Matched ${result.matchedCount}, updated ${result.modifiedCount} pre-existing pharmacies to APPROVED.`);

    const stillPending = await Pharmacy.countDocuments({ licenseNumber: { $exists: false } });
    if (stillPending > 0) {
      console.warn(
        `${stillPending} pharmacies have no licenseNumber (registered before this change). ` +
          `licenseNumber is not retroactively required for existing pharmacies — this is informational only.`,
      );
    }

    console.log("\nBackfill complete.");
  } catch (error) {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

backfillPharmacyVerificationStatus();
