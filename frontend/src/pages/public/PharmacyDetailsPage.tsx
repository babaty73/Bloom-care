import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as pharmacyService from "../../services/pharmacy.service";
import type { PublicPharmacyProfile } from "../../types/pharmacy.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";
import { formatOpenStatusLabel } from "../../utils/pharmacyStatus";

// NOTE: PublicPharmacyProfile intentionally has no `email` field —
// IMPLEMENTATION_DECISIONS.md §7 "Public vs private pharmacy fields" excludes it
// from the public payload; the backend (pharmacy.service.js toVisitorPharmacy)
// strips it before this component ever sees a response.

type LoadState = "loading" | "error" | "success";

function PharmacyDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pharmacy, setPharmacy] = useState<PublicPharmacyProfile | null>(null);

  async function load() {
    if (!id) return;
    setState("loading");
    setError(null);
    try {
      const result = await pharmacyService.getPharmacyById(id);
      setPharmacy(result);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load pharmacy details");
      setState("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (state === "loading") return <Loading label="Loading pharmacy details..." />;
  if (state === "error" || !pharmacy) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <ErrorMessage message={error ?? "Pharmacy not found"} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center gap-4">
        {pharmacy.logo && (
          <img src={pharmacy.logo} alt="" className="h-14 w-14 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{pharmacy.pharmacyName}</h1>
          <p className="text-gray-500">{pharmacy.address}</p>
        </div>
      </div>

      <p className={`text-sm font-medium ${pharmacy.isOpen ? "text-emerald-600" : "text-red-600"}`}>
        {formatOpenStatusLabel(pharmacy.isOpen, pharmacy.openingTime, pharmacy.closingTime)}
      </p>

      <div className="flex flex-wrap gap-2 text-sm font-medium">
        <a href={`tel:${pharmacy.phone}`} className="rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
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
      </div>
    </div>
  );
}

export default PharmacyDetailsPage;
