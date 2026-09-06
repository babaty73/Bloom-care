import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";
import { useAuth } from "../../hooks/useAuth";
import type { UserRole } from "../../types/auth.types";
import EmergencyCallButton from "../common/EmergencyCallButton";

interface NavLinkItem {
  to: string;
  label: string;
}

// Role-aware nav links. Contract: never mix pharmacy and admin links together —
// a pharmacy user must never see admin navigation and vice versa.
function getRoleLinks(role: UserRole | null): NavLinkItem[] {
  if (role === "pharmacy") {
    return [
      { to: "/pharmacy/dashboard", label: "Dashboard" },
      { to: "/pharmacy/medicines", label: "Medicines" },
      { to: "/pharmacy/reports", label: "Reports" },
      { to: "/pharmacy/profile", label: "Profile" },
    ];
  }
  if (role === "admin") {
    return [
      { to: "/admin/dashboard", label: "Dashboard" },
      { to: "/admin/pharmacies", label: "Pharmacies" },
      { to: "/admin/reports", label: "Reports" },
      { to: "/admin/medicines", label: "Medicines" },
    ];
  }
  return [
    { to: "/pharmacy/login", label: "Pharmacy Login" },
    { to: "/admin/login", label: "Admin Login" },
  ];
}

function Navbar() {
  const { role, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roleLinks = getRoleLinks(role);
  const isAuthenticated = role !== null;

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    logout();
    closeMobileMenu();
    navigate("/");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-emerald-700" onClick={closeMobileMenu}>
          Bloom-Care
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 text-sm font-medium text-gray-600 sm:flex">
          <Link to="/search" className="hover:text-emerald-700">
            Find Medicine
          </Link>
          {roleLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-emerald-700">
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button type="button" onClick={handleLogout} className="hover:text-emerald-700">
              Logout
            </button>
          )}
          <EmergencyCallButton />
        </nav>

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          className="text-2xl text-gray-700 sm:hidden"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile nav panel */}
      {isMobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 sm:hidden">
          <Link to="/search" className="rounded-md px-2 py-2 hover:bg-gray-50" onClick={closeMobileMenu}>
            Find Medicine
          </Link>
          {roleLinks.map((link) => (
            <Link key={link.to} to={link.to} className="rounded-md px-2 py-2 hover:bg-gray-50" onClick={closeMobileMenu}>
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-2 py-2 text-left hover:bg-gray-50"
            >
              Logout
            </button>
          )}
          <div className="px-2 py-2">
            <EmergencyCallButton />
          </div>
        </nav>
      )}
    </header>
  );
}

export default Navbar;
