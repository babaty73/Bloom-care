import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-2 text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">
        Back to home
      </Link>
    </div>
  );
}

export default NotFoundPage;
