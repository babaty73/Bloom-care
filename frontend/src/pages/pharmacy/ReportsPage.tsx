import { useEffect, useState } from "react";
import * as reportService from "../../services/report.service";
import type { AdminReport } from "../../types/admin.types";
import { REPORT_REASON_LABELS } from "../../types/report.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

// Contract: Report Decisions §5 — pharmacies may view reports concerning their
// own listings, read-only. Pharmacies cannot change report status.

type LoadState = "loading" | "error" | "success";

function ReportsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<AdminReport[]>([]);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const result = await reportService.listOwnReports(1, 50);
      setReports(result.items);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load reports");
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state === "loading") return <Loading label="Loading reports..." />;
  if (state === "error") return <ErrorMessage message={error ?? "Something went wrong"} onRetry={load} />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Reports About Your Pharmacy</h1>

      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">No reports have been submitted about your listings.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li key={report._id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">{REPORT_REASON_LABELS[report.reason]}</p>
                  {report.additionalComment && <p className="mt-1 text-sm text-gray-600">{report.additionalComment}</p>}
                  <p className="mt-1 text-xs text-gray-400">Medicine: {report.medicineId}</p>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ReportsPage;
