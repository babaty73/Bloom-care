import { useEffect, useState, type FormEvent } from "react";
import * as medicineService from "../../services/medicine.service";
import type { Medicine, MedicineCreatePayload, MedicineUpdatePayload } from "../../types/medicine.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

type LoadState = "loading" | "error" | "success";

// Matches the page size already used elsewhere in the app (public search).
const LIMIT = 20;

const emptyForm: MedicineCreatePayload = {
  medicineName: "",
  genericName: "",
  brandName: "",
  description: "",
  category: "",
  price: 0,
  quantity: 0,
  expirationDate: "",
};

function MedicinesPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicineCreatePayload>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load(targetPage: number) {
    setState("loading");
    setError(null);
    try {
      const result = await medicineService.listOwnMedicines(targetPage, LIMIT);
      // If the requested page is now out of range (e.g. after deleting the
      // last item on the last page), fall back to the last valid page rather
      // than showing a confusing empty page with working Previous/Next controls.
      if (result.items.length === 0 && targetPage > 1 && targetPage > result.pagination.totalPages) {
        await load(result.pagination.totalPages);
        return;
      }
      setMedicines(result.items);
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load medicines");
      setState("error");
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof MedicineCreatePayload>(key: K, value: MedicineCreatePayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit(medicine: Medicine) {
    setEditingId(medicine._id);
    setForm({
      medicineName: medicine.medicineName,
      genericName: medicine.genericName,
      brandName: medicine.brandName ?? "",
      description: medicine.description ?? "",
      category: medicine.category ?? "",
      price: medicine.price,
      quantity: medicine.quantity,
      expirationDate: medicine.expirationDate ? medicine.expirationDate.slice(0, 10) : "",
    });
    setFormError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
  }

  function buildPayload(): MedicineUpdatePayload {
    return {
      medicineName: form.medicineName,
      genericName: form.genericName,
      // description/category are required (docs/ARCHITECTURE.md §1.3) — always
      // included, never silently dropped when the field happens to be empty;
      // the "required" input attributes below stop that case from being
      // submittable in the first place (same pattern already used for
      // expirationDate).
      description: form.description,
      category: form.category,
      price: Number(form.price),
      quantity: Number(form.quantity),
      expirationDate: form.expirationDate,
      // brandName remains optional — only included when actually provided.
      ...(form.brandName ? { brandName: form.brandName } : {}),
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingId) {
        await medicineService.updateMedicine(editingId, payload);
      } else {
        await medicineService.createMedicine(payload as MedicineCreatePayload);
      }
      resetForm();
      // The just-created/edited listing is now the most recently updated, so
      // it sorts to page 1 under the existing "updatedAt desc" ordering —
      // jump there so the pharmacy immediately sees what they just saved.
      await load(1);
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError
          ? `${err.message}${err.details.length ? `: ${err.details.join(", ")}` : ""}`
          : "Failed to save medicine",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this medicine listing?")) return;
    try {
      await medicineService.deleteMedicine(id);
      // Reload the page the pharmacy was already on; load() falls back to the
      // last valid page if this was the only item left on it.
      await load(page);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete medicine");
    }
  }

  function goToPage(nextPage: number) {
    load(nextPage);
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Manage Medicines</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-medium text-gray-900">{editingId ? "Edit Medicine" : "Add Medicine"}</h2>

        {formError && <ErrorMessage message={formError} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Medicine Name
            <input
              required
              value={form.medicineName}
              onChange={(e) => update("medicineName", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Generic Name
            <input
              required
              value={form.genericName}
              onChange={(e) => update("genericName", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Brand Name (optional)
            <input
              value={form.brandName}
              onChange={(e) => update("brandName", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Category
            <input
              required
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Price (ETB)
            <input
              type="number"
              min={0}
              step="0.01"
              required
              value={form.price}
              onChange={(e) => update("price", Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Quantity
            <input
              type="number"
              min={0}
              step="1"
              required
              value={form.quantity}
              onChange={(e) => update("quantity", Number(e.target.value))}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
            Expiration Date
            <input
              type="date"
              required
              value={form.expirationDate}
              onChange={(e) => update("expirationDate", e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
          Description
          <textarea
            required
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            rows={2}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : editingId ? "Update Medicine" : "Add Medicine"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div>
        <h2 className="mb-2 text-lg font-medium text-gray-900">Your Inventory</h2>

        {state === "loading" && <Loading label="Loading medicines..." />}
        {state === "error" && <ErrorMessage message={error ?? "Something went wrong"} onRetry={() => load(page)} />}
        {state === "success" && medicines.length === 0 && (
          <p className="text-sm text-gray-500">No medicines added yet. Use the form above to add your first one.</p>
        )}
        {state === "success" && medicines.length > 0 && (
          <>
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {medicines.map((medicine) => (
                <li key={medicine._id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{medicine.medicineName}</p>
                    <p className="text-gray-500">
                      {medicine.genericName} • {medicine.price} ETB •{" "}
                      <span className={medicine.inStock ? "text-emerald-600" : "text-red-600"}>
                        {medicine.inStock ? `In Stock (${medicine.quantity})` : "Out of Stock"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(medicine)}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(medicine._id)}
                      className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-3 text-sm">
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
    </div>
  );
}

export default MedicinesPage;
