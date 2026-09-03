import { Routes, Route } from "react-router-dom";
import { publicRoutes } from "./public.routes";
import { pharmacyRoutes } from "./pharmacy.routes";
import { adminRoutes } from "./admin.routes";
import NotFoundPage from "../pages/public/NotFoundPage";

// TODO (Reports+Admin domain): mount protected admin management routes (dashboard,
// pharmacies, reports) here once implemented — admin.routes.tsx currently only
// has the login route.

function AppRoutes() {
  return (
    <Routes>
      {publicRoutes()}
      {pharmacyRoutes()}
      {adminRoutes()}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
