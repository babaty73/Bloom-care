import { useState, type FormEvent, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import * as authService from "../../services/auth.service";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";
import type { PharmacyRegisterPayload } from "../../types/auth.types";

// Pharmacy Verification: registration does NOT create a session (no token is
// issued — see auth.service.js on the backend). This page therefore calls
// authService.registerPharmacy directly rather than going through
// useAuth()/AuthContext, and shows an application reference instead of
// redirecting to the dashboard.

type TextFields = Omit<PharmacyRegisterPayload, "licenseDocument">;

const initialForm: TextFields = {
  pharmacyName: "",
  address: "",
  phone: "",
  email: "",
  password: "",
  googleMapsLink: "",
  openingTime: "",
  closingTime: "",
  licenseNumber: "",
};

// Cloudinary License-Document Decision: mirrors the backend's own allowed
// types/size limit (validate.middleware.js validateLicenseDocument,
// upload.middleware.js) so the applicant gets immediate feedback instead of
// waiting on a round trip for a mistake the backend would reject anyway.
// This is a convenience check only — the backend re-validates independently
// (magic-byte sniffing, not just extension/MIME) and is the real guard.
const ALLOWED_LICENSE_DOCUMENT_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_LICENSE_DOCUMENT_BYTES = 10 * 1024 * 1024;

function RegisterPage() {
  const [form, setForm] = useState<TextFields>(initialForm);
  const [licenseDocument, setLicenseDocument] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationReference, setApplicationReference] = useState<string | null>(null);

  function update<K extends keyof TextFields>(key: K, value: TextFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setLicenseDocument(null);
      return;
    }
    if (!ALLOWED_LICENSE_DOCUMENT_TYPES.includes(file.type)) {
      setFileError("License document must be a JPG, PNG, or PDF file.");
      setLicenseDocument(null);
      return;
    }
    if (file.size > MAX_LICENSE_DOCUMENT_BYTES) {
      setFileError("License document must be 10MB or smaller.");
      setLicenseDocument(null);
      return;
    }
    setLicenseDocument(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDetails([]);

    if (!licenseDocument) {
      setFileError("A license document (JPG, PNG, or PDF) is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authService.registerPharmacy({ ...form, licenseDocument });
      setApplicationReference(result.applicationReference);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
        setDetails(err.details);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (applicationReference) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Application Submitted</h1>
        <p className="text-sm text-gray-600">
          Thanks for registering. An admin will review your pharmacy license before it appears in visitor search.
          Save your application reference below — you'll need it, along with your email, to check your status.
        </p>
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 font-mono text-lg font-semibold tracking-wide text-emerald-700">
          {applicationReference}
        </p>
        <Link to="/pharmacy/application-status" className="font-medium text-emerald-700 hover:underline">
          Check your application status
        </Link>
        <Link to="/pharmacy/login" className="text-sm text-gray-500 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">Register Your Pharmacy</h1>

      {error && (
        <ErrorMessage
          message={details.length > 0 ? `${error}: ${details.join(", ")}` : error}
        />
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Pharmacy Name
          <input
            required
            value={form.pharmacyName}
            onChange={(e) => update("pharmacyName", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Address
          <input
            required
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Phone
          <input
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Password
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-xs font-normal text-gray-500">At least 8 characters, with a letter and a number.</span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Google Maps Link
          <input
            required
            placeholder="https://maps.app.goo.gl/..."
            value={form.googleMapsLink}
            onChange={(e) => update("googleMapsLink", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-xs font-normal text-gray-500">
            Open Google Maps, search for your pharmacy, tap Share, and paste the link here.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Pharmacy License Number
          <input
            required
            maxLength={100}
            value={form.licenseNumber}
            onChange={(e) => update("licenseNumber", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-xs font-normal text-gray-500">
            An admin will verify this before your pharmacy appears in visitor search.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          License Document
          <input
            type="file"
            required
            accept="image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-xs font-normal text-gray-500">
            A JPG, PNG, or PDF copy of your pharmacy license (max 10MB). An admin reviews this before approving your
            application.
          </span>
          {fileError && <span className="text-xs font-normal text-red-600">{fileError}</span>}
          {licenseDocument && !fileError && (
            <span className="text-xs font-normal text-emerald-600">Selected: {licenseDocument.name}</span>
          )}
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Opening Time
            <input
              type="time"
              required
              value={form.openingTime}
              onChange={(e) => update("openingTime", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Closing Time
            <input
              type="time"
              required
              value={form.closingTime}
              onChange={(e) => update("closingTime", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <Link to="/pharmacy/login" className="font-medium text-emerald-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export default RegisterPage;
