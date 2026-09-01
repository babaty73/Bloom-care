import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";
import type { PharmacyRegisterPayload } from "../../types/auth.types";

const initialForm: PharmacyRegisterPayload = {
  pharmacyName: "",
  address: "",
  phone: "",
  email: "",
  password: "",
  googleMapsLink: "",
  openingTime: "",
  closingTime: "",
};

function RegisterPage() {
  const { registerPharmacy } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<PharmacyRegisterPayload>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function update<K extends keyof PharmacyRegisterPayload>(key: K, value: PharmacyRegisterPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setDetails([]);
    setIsSubmitting(true);
    try {
      await registerPharmacy(form);
      navigate("/pharmacy/dashboard");
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

        <div className="grid grid-cols-2 gap-4">
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
          {isSubmitting ? "Registering..." : "Register"}
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
