"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RecentSearch {
  id: number;
  homeAirport: string;
  destinations: string;
  departDate: string;
  returnDate: string | null;
  tripDuration: string;
  customDays: string | null;
  allowLayovers: boolean;
  createdAt: string;
}

function formatDate(value: string) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SearchHistory() {
  const router = useRouter();
  const [searches, setSearches] = useState<RecentSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSearches = async () => {
      try {
        const response = await fetch("http://localhost:8081/api/flight-searches");
        if (!response.ok) throw new Error("Failed to load searches");
        const data = (await response.json()) as RecentSearch[];
        setSearches(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Error loading searches:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSearches();
  }, []);

  const deleteSearch = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:8081/api/flight-searches/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete search");
      setSearches(searches.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting search:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Search History</h1>
            <p className="mt-2 text-slate-600">View and manage all your flight searches</p>
          </div>
          <Link href="/" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 transition-colors">
            New Search
          </Link>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-lg">
            <p className="text-slate-600 font-medium">Loading searches...</p>
          </div>
        ) : searches.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-lg">
            <p className="text-slate-600 font-medium text-lg">No searches yet</p>
            <p className="text-slate-500 mt-2">Start by creating a new flight search</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 transition-colors">
              Create First Search
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {searches.map((search) => (
              <div key={search.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  {/* Search Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                        {search.homeAirport} → {search.destinations.split(",").join(", ")}
                      </div>
                      {search.allowLayovers && (
                        <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-1">Layovers allowed</span>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                      <div>
                        <p className="text-slate-600">Departure</p>
                        <p className="font-semibold text-slate-900">{formatDate(search.departDate)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Return</p>
                        <p className="font-semibold text-slate-900">{search.returnDate ? formatDate(search.returnDate) : "—"}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Duration</p>
                        <p className="font-semibold text-slate-900">{search.tripDuration || "Custom"}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Searched</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(search.createdAt).toLocaleDateString("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                    <button
                      onClick={() => router.push("/results")}
                      className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 transition-colors text-sm"
                    >
                      View Results
                    </button>
                    <button
                      onClick={() => deleteSearch(search.id)}
                      className="rounded-full border border-slate-300 hover:bg-red-50 text-slate-700 hover:text-red-700 font-semibold px-4 py-2 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
