import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/admin/LoginPage";
import DashboardPage from "../pages/admin/DashboardPage";
import PharmaciesPage from "../pages/admin/PharmaciesPage";
import ReportsPage from "../pages/admin/ReportsPage";
import MedicineListingsPage from "../pages/admin/MedicineListingsPage";

export function adminRoutes() {
  return [
    <Route key="admin-login" path="/admin/login" element={<LoginPage />} />,
    <Route key="admin-protected" element={<ProtectedRoute allowedRole="admin" redirectTo="/admin/login" />}>
      <Route path="/admin/dashboard" element={<DashboardPage />} />
      <Route path="/admin/pharmacies" element={<PharmaciesPage />} />
      <Route path="/admin/reports" element={<ReportsPage />} />
      <Route path="/admin/medicines" element={<MedicineListingsPage />} />
    </Route>,
  ];
}
