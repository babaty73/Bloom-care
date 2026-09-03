import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as medicineService from "../../services/medicine.service";
import type { PublicMedicineResult } from "../../types/medicine.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";
import { formatRelativeTime, formatExpirationDate } from "../../utils/date";
import { formatOpenStatusLabel } from "../../utils/pharmacyStatus";

type LoadState = "loading" | "error" | "success";

function MedicineDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [medicine, setMedicine] = useState<PublicMedicineResult | null>(null);

  async function load() {
    if (!id) return;
    setState("loading");
    setError(null);
    try {
      const result = await medicineService.getMedicineDetails(id);
      setMedicine(result);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load medicine details");
      setState("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (state === "loading") return <Loading label="Loading medicine details..." />;
  if (state === "error" || !medicine) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ErrorMessage message={error ?? "Medicine not found"} onRetry={load} />
      </div>
    );
  }

  const { pharmacy } = medicine;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{medicine.medicineName}</h1>
        <p className="text-gray-500">
          {medicine.genericName}
          {medicine.brandName ? ` · ${medicine.brandName}` : ""}
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-2xl font-semibold text-gray-900">{medicine.price} ETB</p>
          <p className={medicine.inStock ? "text-emerald-600" : "text-red-600"}>
            {medicine.inStock ? `In Stock (${medicine.quantity})` : "Out of Stock"}
          </p>
        </div>
        <div className="text-right text-sm text-gray-500">
          <p>Updated {formatRelativeTime(medicine.lastUpdated)}</p>
          {medicine.expirationDate && <p>Expires {formatExpirationDate(medicine.expirationDate)}</p>}
        </div>
      </div>

      {medicine.description && <p className="text-sm text-gray-700">{medicine.description}</p>}
      {medicine.category && <p className="text-xs uppercase tracking-wide text-gray-400">{medicine.category}</p>}

      {pharmacy && (
        <div className="rounded-lg border border-gray-200 p-4">
          <Link to={`/pharmacies/${pharmacy._id}`} className="text-lg font-semibold text-emerald-700 hover:underline">
            {pharmacy.pharmacyName}
          </Link>
          <p className="text-sm text-gray-500">{pharmacy.address}</p>
          <p className={`text-sm ${pharmacy.isOpen ? "text-emerald-600" : "text-red-600"}`}>
            {formatOpenStatusLabel(pharmacy.isOpen, pharmacy.openingTime, pharmacy.closingTime)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-sm font-medium">
            <a
              href={`tel:${pharmacy.phone}`}
              className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Call Pharmacy
            </a>
            <a
              href={pharmacy.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Get Directions
            </a>
            <Link
              to={`/report?medicineId=${medicine._id}&pharmacyId=${pharmacy._id}`}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Report Incorrect Info
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicineDetailsPage;
