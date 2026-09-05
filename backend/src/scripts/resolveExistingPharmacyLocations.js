import "dotenv/config";
import mongoose from "mongoose";
import Pharmacy from "../models/Pharmacy.js";
import { resolvePharmacyLocation } from "../utils/googleMaps.js";
import config from "../config/env.js";

async function resolveExistingPharmacyLocations() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB.");

    const pharmacies = await Pharmacy.find({
      $or: [
        { location: null },
        { location: { $exists: false } },
      ],
    });

    console.log(`Found ${pharmacies.length} pharmacies without locations.`);

    let resolved = 0;
    let failed = 0;

    for (const pharmacy of pharmacies) {
      try {
        const location = await resolvePharmacyLocation(
          pharmacy.googleMapsLink
        );

        pharmacy.location = location;
        await pharmacy.save();

        resolved++;

        console.log(
          `✓ ${pharmacy.pharmacyName}: ${location.latitude}, ${location.longitude}`
        );
      } catch (error) {
        failed++;

        console.warn(
          `✗ ${pharmacy.pharmacyName}: ${error.message}`
        );
      }
    }

    console.log("\nMigration complete.");
    console.log(`Resolved: ${resolved}`);
    console.log(`Failed: ${failed}`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

resolveExistingPharmacyLocations();