import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import * as reportService from "../../services/report.service";
import { REPORT_REASON_LABELS, type ReportReason } from "../../types/report.types";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

// Contract: docs/IMPLEMENTATION_DECISIONS.md Report Decisions §1, §6 — a report
// always references a specific medicine listing (medicineId) and the pharmacy that
// owns it (pharmacyId); there is no pharmacy-only report. Both must be supplied
// via query params from a medicine search result / details page.

const REPORT_REASONS = Object.keys(REPORT_REASON_LABELS) as ReportReason[];

function ReportPage() {
  const [searchParams] = useSearchParams();
  const medicineId = searchParams.get("medicineId");
  const pharmacyId = searchParams.get("pharmacyId");

  const [reason, setReason] = useState<ReportReason>("MEDICINE_NOT_AVAILABLE");
  const [additionalComment, setAdditionalComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!medicineId || !pharmacyId) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <ErrorMessage message="Reporting requires starting from a specific medicine result." />
        <Link to="/search" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">
          Go to medicine search
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await reportService.submitReport({
        medicineId: medicineId!,
        pharmacyId: pharmacyId!,
        reason,
        additionalComment: additionalComment.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? `${err.message}${err.details.length ? `: ${err.details.join(", ")}` : ""}`
          : "Failed to submit report",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Thanks for the report</h1>
        <p className="mt-2 text-sm text-gray-600">
          Our team will review it. This helps keep Bloom-Care accurate for everyone.
        </p>
        <Link to="/search" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold text-gray-900">Report incorrect information</h1>
      <p className="mt-1 text-sm text-gray-500">
        Let us know what&apos;s wrong so we can keep this listing accurate.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {error && <ErrorMessage message={error} />}

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Reason
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as ReportReason)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            {REPORT_REASONS.map((value) => (
              <option key={value} value={value}>
                {REPORT_REASON_LABELS[value]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Additional comment (optional)
          <textarea
            value={additionalComment}
            onChange={(e) => setAdditionalComment(e.target.value)}
            rows={3}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}

export default ReportPage;
