import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as pharmacyService from "../../services/pharmacy.service";
import type { PharmacyDashboard, OwnPharmacyProfile } from "../../types/pharmacy.types";
import Loading from "../../components/common/Loading";
import ErrorMessage from "../../components/common/ErrorMessage";
import { ApiRequestError } from "../../utils/api";

type LoadState = "loading" | "error" | "success";

function DashboardPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [dashboard, setDashboard] = useState<PharmacyDashboard | null>(null);
  const [profile, setProfile] = useState<OwnPharmacyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const [dashboardData, profileData] = await Promise.all([
        pharmacyService.getOwnDashboard(),
        pharmacyService.getOwnProfile(),
      ]);
      setDashboard(dashboardData);
      setProfile(profileData);
      setState("success");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load dashboard");
      setState("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (state === "loading") return <Loading label="Loading dashboard..." />;
  if (state === "error") return <ErrorMessage message={error ?? "Something went wrong"} onRetry={load} />;
  if (!dashboard) return null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {profile?.verificationStatus === "PENDING" && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Your pharmacy is awaiting admin verification. You can set up your profile and inventory now — everything
          will be ready the moment you're approved — but visitors won't see your pharmacy in search until then.
        </div>
      )}
      {profile?.verificationStatus === "REJECTED" && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Your pharmacy's verification was not approved, so it isn't visible to visitors. Check your license
          information on your profile and contact the platform if you believe this is a mistake.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Medicines</p>
          <p className="text-2xl font-semibold text-gray-900">{dashboard.totalMedicines}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">In Stock</p>
          <p className="text-2xl font-semibold text-emerald-600">{dashboard.inStockCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="text-2xl font-semibold text-red-600">{dashboard.outOfStockCount}</p>
        </div>
        <Link to="/pharmacy/reports" className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50">
          <p className="text-sm text-gray-500">Reports</p>
          <p className="text-2xl font-semibold text-gray-900">{dashboard.reportsCount}</p>
        </Link>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Recently Updated</h2>
          <Link to="/pharmacy/medicines" className="text-sm font-medium text-emerald-600 hover:underline">
            Manage medicines
          </Link>
        </div>

        {dashboard.recentlyUpdated.length === 0 ? (
          <p className="text-sm text-gray-500">No medicines added yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
            {dashboard.recentlyUpdated.map((medicine) => (
              <li key={medicine._id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="min-w-0 break-words font-medium text-gray-900">{medicine.medicineName}</span>
                <span className={`shrink-0 ${medicine.inStock ? "text-emerald-600" : "text-red-600"}`}>
                  {medicine.inStock ? `In Stock (${medicine.quantity})` : "Out of Stock"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
