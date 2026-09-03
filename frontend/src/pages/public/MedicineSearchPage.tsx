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

  useEffect(() => {
    setQueryInput(search);
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");
      setError(null);
      try {
        const result = await medicineService.searchMedicines({ search: search || undefined, page, limit: LIMIT });
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
  }, [search, page]);

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
