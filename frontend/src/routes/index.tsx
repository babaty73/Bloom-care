import { Routes, Route } from "react-router-dom";
import { pharmacyRoutes } from "./pharmacy.routes";
import { adminRoutes } from "./admin.routes";

// TODO (medicine-search / public domain): mount public.routes.tsx here (home,
// medicine search, medicine details, pharmacy details, report submission) once
// implemented — replace the placeholder "/" route below.
// TODO (Reports+Admin domain): mount protected admin routes here once implemented.

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="p-8 text-center text-gray-500">
            Bloom-Care — visitor medicine search coming soon.
          </div>
        }
      />
      {pharmacyRoutes()}
      {adminRoutes()}
      <Route path="*" element={<div className="p-8 text-center text-gray-500">Page not found.</div>} />
    </Routes>
  );
}

export default AppRoutes;
