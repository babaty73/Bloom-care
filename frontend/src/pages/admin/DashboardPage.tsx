import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as adminService from "../../services/admin.service";
import type { AdminDashboardStats } from "../../types/admin.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

type LoadState = "loading" | "error" | "success";

function DashboardPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const data = await adminService.getDashboard();
      setStats(data);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load dashboard");
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state === "loading") return <Loading label="Loading platform stats..." />;
  if (state === "error") return <ErrorMessage message={error ?? "Something went wrong"} onRetry={load} />;
  if (!stats) return null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Pharmacies</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.pharmacies.total}</p>
          <p className="mt-1 text-xs text-gray-500">
            {stats.pharmacies.active} active · {stats.pharmacies.suspended} suspended · {stats.pharmacies.banned} banned
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Medicine Listings</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.totalMedicines}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Reports</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.reports.total}</p>
          <p className="mt-1 text-xs text-amber-600">{stats.reports.pending} pending review</p>
        </div>
      </div>

      <div className="flex gap-4 text-sm font-medium">
        <Link to="/admin/pharmacies" className="text-emerald-700 hover:underline">
          Manage pharmacies
        </Link>
        <Link to="/admin/reports" className="text-emerald-700 hover:underline">
          Review reports
        </Link>
        <Link to="/admin/medicines" className="text-emerald-700 hover:underline">
          Remove a medicine listing
        </Link>
      </div>
    </div>
  );
}

export default DashboardPage;
