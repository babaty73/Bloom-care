import { Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/pharmacy/LoginPage";
import RegisterPage from "../pages/pharmacy/RegisterPage";
import DashboardPage from "../pages/pharmacy/DashboardPage";
import ProfilePage from "../pages/pharmacy/ProfilePage";
import MedicinesPage from "../pages/pharmacy/MedicinesPage";
import ReportsPage from "../pages/pharmacy/ReportsPage";

export function pharmacyRoutes() {
  return [
    <Route key="pharmacy-login" path="/pharmacy/login" element={<LoginPage />} />,
    <Route key="pharmacy-register" path="/pharmacy/register" element={<RegisterPage />} />,
    <Route
      key="pharmacy-protected"
      element={<ProtectedRoute allowedRole="pharmacy" redirectTo="/pharmacy/login" />}
    >
      <Route path="/pharmacy/dashboard" element={<DashboardPage />} />
      <Route path="/pharmacy/profile" element={<ProfilePage />} />
      <Route path="/pharmacy/medicines" element={<MedicinesPage />} />
      <Route path="/pharmacy/reports" element={<ReportsPage />} />
    </Route>,
  ];
}
