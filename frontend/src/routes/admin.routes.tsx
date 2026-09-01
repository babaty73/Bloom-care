import { Route } from "react-router-dom";
import LoginPage from "../pages/admin/LoginPage";

// NOTE: only the admin login route is implemented here (Auth domain, shared
// infrastructure). Protected admin pages (dashboard, pharmacies, reports) belong
// to the Reports+Admin domain — add them here with
// <ProtectedRoute allowedRole="admin" redirectTo="/admin/login" /> once built.
export function adminRoutes() {
  return [<Route key="admin-login" path="/admin/login" element={<LoginPage />} />];
}
