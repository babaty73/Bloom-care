import { Link } from "react-router-dom";

// Trust & Launch Polish (Domain 7). No contact link is included — no real
// contact channel exists for this project yet (see PrivacyPolicyPage), and a
// placeholder/dead link would be worse than omitting it. No social links,
// since none exist.
function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-sm text-xs text-gray-500">
          Bloom-Care helps you find medicine at nearby pharmacies before you travel.
        </p>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium">
          <Link to="/" className="hover:text-emerald-700">
            Home
          </Link>
          <Link to="/search" className="hover:text-emerald-700">
            Find Medicine
          </Link>
          <Link to="/pharmacy/register" className="hover:text-emerald-700">
            Register Your Pharmacy
          </Link>
          <Link to="/privacy" className="hover:text-emerald-700">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-emerald-700">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
