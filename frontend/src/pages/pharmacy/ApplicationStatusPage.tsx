import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as pharmacyService from "../../services/pharmacy.service";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";
import type { ApplicationStatusResult } from "../../types/auth.types";

// Pharmacy Verification: public, tokenless lookup for an applicant who
// registered but does not yet have (or is not eligible for, while PENDING/
// REJECTED) an operational session.

function ApplicationStatusPage() {
  const [applicationReference, setApplicationReference] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ApplicationStatusResult | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setResult(null);
    setIsSubmitting(true);
    try {
      const data = await pharmacyService.checkApplicationStatus({ applicationReference, email });
      setResult(data);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Check Application Status</h1>
      <p className="text-sm text-gray-600">
        Enter the application reference you were given at registration, along with the email you registered with.
      </p>

      {error && <ErrorMessage message={error} />}

      {result && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            result.verificationStatus === "APPROVED"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : result.verificationStatus === "REJECTED"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
          }`}
        >
          {result.verificationStatus === "APPROVED" && (
            <>Your pharmacy has been approved. You can now log in.</>
          )}
          {result.verificationStatus === "PENDING" && <>Your application is still awaiting admin review.</>}
          {result.verificationStatus === "REJECTED" && (
            <>Your application was not approved. Contact the platform if you believe this is a mistake.</>
          )}
        </div>
      )}

      {result?.verificationStatus === "APPROVED" && (
        <Link to="/pharmacy/login" className="text-sm font-medium text-emerald-700 hover:underline">
          Go to login
        </Link>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Application Reference
          <input
            required
            placeholder="BC-XXXXXX"
            value={applicationReference}
            onChange={(e) => setApplicationReference(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono uppercase focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? "Checking..." : "Check Status"}
        </button>
      </form>
    </div>
  );
}

export default ApplicationStatusPage;
