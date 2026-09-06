import { Routes, Route } from "react-router-dom";
import { publicRoutes } from "./public.routes";
import { pharmacyRoutes } from "./pharmacy.routes";
import { adminRoutes } from "./admin.routes";
import NotFoundPage from "../pages/public/NotFoundPage";

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
