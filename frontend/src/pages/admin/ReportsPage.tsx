import { useEffect, useState } from "react";
import * as adminService from "../../services/admin.service";
import type { AdminReport, AdminReportStatus } from "../../types/admin.types";
import { REPORT_REASON_LABELS } from "../../types/report.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

// NOTE: there is no GET /api/admin/medicines listing endpoint in the documented
// API contract, so this page offers "Remove Medicine Listing" using the
// medicineId already present on each report (the spec's own admin workflow:
// review a report, then optionally remove the listing it concerns). A separate
// browsable medicine-moderation list isn't possible without inventing an
// undocumented endpoint — see admin/MedicineListingsPage.tsx.

type LoadState = "loading" | "error" | "success";

const STATUS_FILTERS: Array<AdminReportStatus | "ALL"> = ["ALL", "PENDING", "RESOLVED", "REJECTED"];

function ReportsPage() {
  const [filter, setFilter] = useState<AdminReportStatus | "ALL">("PENDING");
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [removedMedicineIds, setRemovedMedicineIds] = useState<Set<string>>(new Set());

  async function load() {
    setState("loading");
    setError(null);
    try {
      const result = await adminService.listReports(filter === "ALL" ? {} : { status: filter }, 1, 50);
      setReports(result.items);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load reports");
      setState("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function handleReview(id: string, status: "RESOLVED" | "REJECTED") {
    setActionError(null);
    try {
      const updated = await adminService.reviewReport(id, status);
      setReports((prev) => prev.map((r) => (r._id === id ? updated : r)));
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to update report");
    }
  }

  async function handleRemoveMedicine(medicineId: string) {
    setActionError(null);
    try {
      await adminService.deleteMedicine(medicineId);
      setRemovedMedicineIds((prev) => new Set(prev).add(medicineId));
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Failed to remove medicine listing");
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Review Reports</h1>

      <div className="flex gap-2 text-sm">
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md px-3 py-1.5 font-medium ${
              filter === value ? "bg-emerald-600 text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {actionError && <ErrorMessage message={actionError} />}
      {state === "loading" && <Loading label="Loading reports..." />}
      {state === "error" && <ErrorMessage message={error ?? "Something went wrong"} onRetry={load} />}

      {state === "success" && (
        <ul className="flex flex-col gap-3">
          {reports.length === 0 && <p className="text-sm text-gray-500">No reports match this filter.</p>}
          {reports.map((report) => (
            <li key={report._id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{REPORT_REASON_LABELS[report.reason]}</p>
                  {report.additionalComment && <p className="mt-1 text-sm text-gray-600">{report.additionalComment}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    Medicine: {report.medicineId} · Pharmacy: {report.pharmacyId}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    report.status === "PENDING"
                      ? "bg-amber-100 text-amber-700"
                      : report.status === "RESOLVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {report.status}
                </span>
              </div>

              {report.status === "PENDING" && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => handleReview(report._id, "RESOLVED")}
                    className="rounded-md border border-emerald-300 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50"
                  >
                    Mark Resolved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(report._id, "REJECTED")}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={removedMedicineIds.has(report.medicineId)}
                    onClick={() => handleRemoveMedicine(report.medicineId)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:opacity-40"
                  >
                    {removedMedicineIds.has(report.medicineId) ? "Listing Removed" : "Remove Medicine Listing"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ReportsPage;
