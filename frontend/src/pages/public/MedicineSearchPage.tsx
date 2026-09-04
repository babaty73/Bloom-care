import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as medicineService from "../../services/medicine.service";
import type { PublicMedicineResult } from "../../types/medicine.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";
import { formatRelativeTime } from "../../utils/date";
import { formatOpenStatusLabel } from "../../utils/pharmacyStatus";

type LoadState = "loading" | "error" | "success";

// Nearby Pharmacy / Distance decision: visitor coordinates come from the browser
// Geolocation API only when the visitor asks for nearby/distance functionality,
// and are kept in component state only — never persisted (no localStorage, no
// URL search params, no backend storage).
type LocationRequestState = "idle" | "requesting" | "granted" | "denied" | "unavailable";

const LIMIT = 20;

function MedicineSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [queryInput, setQueryInput] = useState(search);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PublicMedicineResult[]>([]);
  const [totalPages, setTotalPages] = useState(1);

  const [locationState, setLocationState] = useState<LocationRequestState>("idle");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    setQueryInput(search);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setError(null);
      try {
        const result = await medicineService.searchMedicines({
          search: search || undefined,
          page,
          limit: LIMIT,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });
        if (cancelled) return;
        setItems(result.items);
        setTotalPages(result.pagination.totalPages);
        setState("success");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : "Failed to load search results");
        setState("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [search, page, coords]);

  function resetPage() {
    const next = new URLSearchParams(searchParams);
    next.delete("page");
    setSearchParams(next);
  }

  function handleFindNearby() {
    if (!navigator.geolocation) {
      setLocationState("unavailable");
      return;
    }

    setLocationState("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationState("granted");
        resetPage();
      },
      (geoError) => {
        setLocationState(geoError.code === geoError.PERMISSION_DENIED ? "denied" : "unavailable");
      },
    );
  }

  function clearNearby() {
    setCoords(null);
    setLocationState("idle");
    resetPage();
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (queryInput.trim()) next.set("search", queryInput.trim());
    setSearchParams(next);
  }

  function goToPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="Search medicine name or generic name..."
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {locationState !== "granted" && (
          <button
            type="button"
            onClick={handleFindNearby}
            disabled={locationState === "requesting"}
            className="rounded-md border border-emerald-300 px-3 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
          >
            {locationState === "requesting" ? "Finding your location..." : "Find Nearby Pharmacies"}
          </button>
        )}
        {locationState === "granted" && (
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              Showing nearest pharmacies first
            </span>
            <button type="button" onClick={clearNearby} className="text-xs font-medium text-gray-500 hover:underline">
              Clear
            </button>
          </div>
        )}
        {locationState === "denied" && (
          <span className="text-xs text-red-600">
            Location access was denied. Enable it in your browser settings to see nearby pharmacies.
          </span>
        )}
        {locationState === "unavailable" && (
          <span className="text-xs text-red-600">
            We couldn&apos;t determine your location. Please try again.
          </span>
        )}
      </div>

      {state === "loading" && <Loading label="Searching..." />}
      {state === "error" && <ErrorMessage message={error ?? "Something went wrong"} onRetry={() => setSearchParams(searchParams)} />}
      {state === "success" && items.length === 0 && (
        <p className="text-sm text-gray-500">
          No matching medicines found{search ? ` for "${search}"` : ""}. Try a different name.
        </p>
      )}

      {state === "success" && items.length > 0 && (
        <>
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item._id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link to={`/medicines/${item._id}`} className="font-semibold text-gray-900 hover:text-emerald-700">
                      {item.medicineName}
                    </Link>
                    <p className="text-sm text-gray-500">{item.genericName}</p>
                    {item.pharmacy && (
                      <Link to={`/pharmacies/${item.pharmacy._id}`} className="text-sm text-emerald-700 hover:underline">
                        {item.pharmacy.pharmacyName}
                      </Link>
                    )}
                    {typeof item.distanceKm === "number" && (
                      <span className="ml-2 text-xs font-medium text-gray-500">{item.distanceKm} km away</span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{item.price} ETB</p>
                    <p className={item.inStock ? "text-sm text-emerald-600" : "text-sm text-red-600"}>
                      {item.inStock ? `In Stock (${item.quantity})` : "Out of Stock"}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  <span>Updated {formatRelativeTime(item.lastUpdated)}</span>
                  {item.pharmacy && (
                    <span className={item.pharmacy.isOpen ? "text-emerald-600" : "text-red-600"}>
                      {formatOpenStatusLabel(item.pharmacy.isOpen, item.pharmacy.openingTime, item.pharmacy.closingTime)}
                    </span>
                  )}
                </div>

                {item.pharmacy && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                    <a
                      href={`tel:${item.pharmacy.phone}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                    >
                      Call Pharmacy
                    </a>
                    <a
                      href={item.pharmacy.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                    >
                      Get Directions
                    </a>
                    <Link
                      to={`/report?medicineId=${item._id}&pharmacyId=${item.pharmacy._id}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                    >
                      Report Incorrect Info
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MedicineSearchPage;
