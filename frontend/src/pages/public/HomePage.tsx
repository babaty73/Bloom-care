import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("search", query.trim());
    navigate(`/search?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Find medicine at nearby pharmacies</h1>
      <p className="text-gray-600">
        Search before you travel. See what&apos;s in stock, compare prices, and check which pharmacies are open
        right now.
      </p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicine name or generic name..."
          className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Search
        </button>
      </form>
    </div>
  );
}

export default HomePage;
