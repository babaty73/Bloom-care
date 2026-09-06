import { useEffect, useState } from "react";
import * as adminService from "../../services/admin.service";
import type { AuthenticatedPharmacy } from "../../types/auth.types";
import type { PharmacyStatus } from "../../types/admin.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

type LoadState = "loading" | "error" | "success";

const STATUS_FILTERS: Array<PharmacyStatus | "ALL"> = ["ALL", "ACTIVE", "SUSPENDED", "BANNED"];

function PharmaciesPage() {
  const [filter, setFilter] = useState<PharmacyStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [pharmacies, setPharmacies] = useState<AuthenticatedPharmacy[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const result = await adminService.listPharmacies(filter === "ALL" ? undefined : filter, page, 50);
      setPharmacies(result.items);
      setTotalPages(result.pagination.totalPages);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load pharmacies");
      setState("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page]);

  function handleFilterChange(value: PharmacyStatus | "ALL") {
    setFilter(value);
    setPage(1);
  }

  async function handleStatusChange(id: string, status: PharmacyStatus) {
    setActionError(null);
    try {
      const updated = await adminService.updatePharmacyStatus(id, status);
      setPharmacies((prev) => prev.map((p) => (p._id === id ? updated : p)));
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to update pharmacy status");
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Permanently remove this pharmacy? This cannot be undone.")) return;
    setActionError(null);
    try {
      await adminService.deletePharmacy(id);
      setPharmacies((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to remove pharmacy");
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Manage Pharmacies</h1>

      <div className="flex gap-2 text-sm">
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleFilterChange(value)}
            className={`rounded-md px-3 py-1.5 font-medium ${
              filter === value ? "bg-emerald-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {state === "loading" && <Loading label="Loading pharmacies..." />}
      {state === "error" && <ErrorMessage message={error ?? "Something went wrong"} onRetry={load} />}

      {state === "success" && (
        <ul className="flex flex-col gap-3">
          {pharmacies.length === 0 && <p className="text-sm text-gray-500">No pharmacies match this filter.</p>}
          {pharmacies.map((pharmacy) => (
            <li key={pharmacy._id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{pharmacy.pharmacyName}</p>
                  <p className="text-sm text-gray-500">{pharmacy.email}</p>
                  <p className="text-sm text-gray-500">{pharmacy.address}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    pharmacy.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : pharmacy.status === "SUSPENDED"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {pharmacy.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                {pharmacy.status !== "ACTIVE" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(pharmacy._id, "ACTIVE")}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    Reactivate
                  </button>
                )}
                {pharmacy.status !== "SUSPENDED" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(pharmacy._id, "SUSPENDED")}
                    className="rounded-md border border-amber-300 px-3 py-1.5 text-amber-700 hover:bg-amber-50"
                  >
                    Suspend
                  </button>
                )}
                {pharmacy.status !== "BANNED" && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange(pharmacy._id, "BANNED")}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50"
                  >
                    Ban
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(pharmacy._id)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50"
                >
                  Remove Permanently
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {state === "success" && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
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
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PharmaciesPage;
