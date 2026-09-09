import { useEffect, useState, type FormEvent } from "react";
import * as pharmacyService from "../../services/pharmacy.service";
import { useAuth } from "../../hooks/useAuth";
import type { OwnPharmacyProfile, PharmacyProfileUpdatePayload } from "../../types/pharmacy.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

type LoadState = "loading" | "error" | "success";

function ProfilePage() {
  const { updatePharmacyState } = useAuth();

  const [state, setState] = useState<LoadState>("loading");
  const [pharmacy, setPharmacy] = useState<OwnPharmacyProfile | null>(null);
  const [form, setForm] = useState<PharmacyProfileUpdatePayload>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const data = await pharmacyService.getOwnProfile();
      setPharmacy(data);
      setForm({
        pharmacyName: data.pharmacyName,
        address: data.address,
        phone: data.phone,
        googleMapsLink: data.googleMapsLink,
        openingTime: data.openingTime,
        closingTime: data.closingTime,
      });
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load profile");
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update<K extends keyof PharmacyProfileUpdatePayload>(key: K, value: PharmacyProfileUpdatePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      const updated = await pharmacyService.updateOwnProfile(form);
      setPharmacy(updated);
      updatePharmacyState(updated);
      setSuccessMessage("Profile updated successfully.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? `${err.message}${err.details.length ? `: ${err.details.join(", ")}` : ""}` : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  }

  if (state === "loading") return <Loading label="Loading profile..." />;
  if (state === "error") return <ErrorMessage message={error ?? "Something went wrong"} onRetry={load} />;
  if (!pharmacy) return null;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Pharmacy Profile</h1>

      {error && <ErrorMessage message={error} />}
      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}
      {pharmacy.locationResolved === false && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          We couldn&apos;t pin your pharmacy&apos;s location from that Google Maps link, so you won&apos;t appear in
          &quot;nearby pharmacy&quot; results yet. Everything else — search, your listing, directions from your
          link — still works normally. Double-check the link below (an address search or place link works best) and
          save again to retry.
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Pharmacy Name
          <input
            required
            value={form.pharmacyName ?? ""}
            onChange={(e) => update("pharmacyName", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Address
          <input
            required
            value={form.address ?? ""}
            onChange={(e) => update("address", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Phone
          <input
            required
            value={form.phone ?? ""}
            onChange={(e) => update("phone", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Google Maps Link
          <input
            required
            value={form.googleMapsLink ?? ""}
            onChange={(e) => update("googleMapsLink", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Opening Time
            <input
              type="time"
              required
              value={form.openingTime ?? ""}
              onChange={(e) => update("openingTime", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Closing Time
            <input
              type="time"
              required
              value={form.closingTime ?? ""}
              onChange={(e) => update("closingTime", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
