import { Link } from "react-router-dom";
import EmergencyCallButton from "../common/EmergencyCallButton";

function Navbar() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-emerald-700">
          Bloom-Care
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
          <Link to="/search" className="hover:text-emerald-700">
            Find Medicine
          </Link>
          <Link to="/pharmacy/login" className="hover:text-emerald-700">
            Pharmacy Login
          </Link>
          <Link to="/admin/login" className="hover:text-emerald-700">
            Admin Login
          </Link>
          <EmergencyCallButton />
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
