import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import * as adminService from "../../services/admin.service";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

// NOTE: The documented API contract (docs/ARCHITECTURE.md §2.5) only defines
// DELETE /api/admin/medicines/:id — there is no GET /api/admin/medicines listing
// endpoint, so a browsable medicine catalog for admins isn't possible without
// inventing an undocumented endpoint. The primary moderation workflow is instead
// via the Reports page (each report already carries the medicineId being
// reported). This page is a direct-removal utility for when the admin already
// has a medicine ID in hand.

function MedicineListingsPage() {
  const [medicineId, setMedicineId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removedId, setRemovedId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!medicineId.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await adminService.deleteMedicine(medicineId.trim());
      setRemovedId(medicineId.trim());
      setMedicineId("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to remove medicine listing");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Remove a Medicine Listing</h1>
      <p className="text-sm text-gray-500">
        Most medicine removals start from a report — see{" "}
        <Link to="/admin/reports" className="text-emerald-700 hover:underline">
          Review Reports
        </Link>
        . Use this if you already have a medicine listing ID to remove directly.
      </p>

      {error && <ErrorMessage message={error} />}
      {removedId && <p className="text-sm text-emerald-600">Removed medicine listing {removedId}.</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={medicineId}
          onChange={(e) => setMedicineId(e.target.value)}
          placeholder="Medicine listing ID"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
        >
          {isSubmitting ? "Removing..." : "Remove"}
        </button>
      </form>
    </div>
  );
}

export default MedicineListingsPage;
