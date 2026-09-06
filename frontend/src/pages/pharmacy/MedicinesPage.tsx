import { useEffect, useState, type FormEvent } from "react";
import * as medicineService from "../../services/medicine.service";
import type { Medicine, MedicineCreatePayload, MedicineUpdatePayload } from "../../types/medicine.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

type LoadState = "loading" | "error" | "success";

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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicineCreatePayload>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const result = await medicineService.listOwnMedicines(1, 50);
      setMedicines(result.items);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load medicines");
      setState("error");
    }
  }

  useEffect(() => {
    load();
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
    const payload: MedicineUpdatePayload = {
      medicineName: form.medicineName,
      genericName: form.genericName,
      price: Number(form.price),
      quantity: Number(form.quantity),
      // expirationDate is required (docs/IMPLEMENTATION_DECISIONS.md, Medicine
      // model). Always included — never silently dropped when the form field
      // happens to be empty; the "required" input attribute below stops that
      // case from being submittable in the first place.
      expirationDate: form.expirationDate,
    };
    if (form.brandName) payload.brandName = form.brandName;
    if (form.description) payload.description = form.description;
    if (form.category) payload.category = form.category;
    return payload;
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
      await load();
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
      await load();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete medicine");
    }
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
            Category (optional)
            <input
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
          Description (optional)
          <textarea
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
        {state === "error" && <ErrorMessage message={error ?? "Something went wrong"} onRetry={load} />}
        {state === "success" && medicines.length === 0 && (
          <p className="text-sm text-gray-500">No medicines added yet. Use the form above to add your first one.</p>
        )}
        {state === "success" && medicines.length > 0 && (
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
        )}
      </div>
    </div>
  );
}

export default MedicinesPage;
