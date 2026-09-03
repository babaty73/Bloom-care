import { Route } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import MedicineSearchPage from "../pages/public/MedicineSearchPage";
import MedicineDetailsPage from "../pages/public/MedicineDetailsPage";
import PharmacyDetailsPage from "../pages/public/PharmacyDetailsPage";
import ReportPage from "../pages/public/ReportPage";

// Public visitor routes — no authentication. Contract: docs/ARCHITECTURE.md
// Public visitor experience (search, medicine/pharmacy details, report entry point).
export function publicRoutes() {
  return [
    <Route key="home" path="/" element={<HomePage />} />,
    <Route key="search" path="/search" element={<MedicineSearchPage />} />,
    <Route key="medicine-details" path="/medicines/:id" element={<MedicineDetailsPage />} />,
    <Route key="pharmacy-details" path="/pharmacies/:id" element={<PharmacyDetailsPage />} />,
    <Route key="report" path="/report" element={<ReportPage />} />,
  ];
}
