"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { AlertIcon, ArrowRightIcon, HistoryIcon, PlaneIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { deleteSearch, listSearches, resultsUrl, type SavedSearch } from "@/lib/api";
import { cityFor } from "@/lib/airports";
import { formatDate, timeAgo } from "@/lib/format";

const durationLabels: Record<string, string> = {
  weekend: "Weekend",
  short: "3 days",
  medium: "5 days",
  week: "1 week",
  custom: "Custom",
};

export default function SearchHistory() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    listSearches()
      .then(setSearches)
      .catch((err) => {
        console.error(err);
        setError("Couldn't load your search history. Is the backend running on port 8081?");
      })
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: number) => {
    setDeleting(id);
    try {
      await deleteSearch(id);
      setSearches((s) => s.filter((x) => x.id !== id));
    } catch (err) {
      console.error(err);
      setError("That search couldn't be deleted. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <SiteHeader />
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 pb-8 pt-6 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-indigo-600">Your trips</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Search history</h1>
            <p className="mt-1 text-slate-500">
              {loading ? "Loading…" : `${searches.length} saved search${searches.length === 1 ? "" : "es"}`}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
          >
            <SearchIcon width={16} height={16} /> New search
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <p className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            <AlertIcon width={16} height={16} /> {error}
          </p>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
            ))}
          </div>
        ) : searches.length === 0 && !error ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-500">
              <HistoryIcon width={28} height={28} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">No searches yet</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Every flight search you run is saved here so you can rerun it later.</p>
            <Link href="/" className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Search your first flight
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {searches.map((search) => {
              const destinations = search.destinations.split(",").filter(Boolean);
              return (
                <li
                  key={search.id}
                  className="group flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-lg hover:shadow-slate-900/5 md:flex-row md:items-center"
                >
                  {/* Route */}
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white sm:grid">
                      <PlaneIcon width={20} height={20} />
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-900">
                        {search.homeAirport}
                        <ArrowRightIcon width={16} height={16} className="text-slate-400" />
                        {destinations.join(", ")}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {cityFor(search.homeAirport)} to {destinations.map(cityFor).join(", ")}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <dl className="grid grid-cols-3 gap-4 text-sm md:w-80 md:shrink-0">
                    <div>
                      <dt className="text-xs text-slate-400">Depart</dt>
                      <dd className="font-medium text-slate-800">{formatDate(search.departDate, { month: "short", day: "numeric" })}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Return</dt>
                      <dd className="font-medium text-slate-800">
                        {search.returnDate ? formatDate(search.returnDate, { month: "short", day: "numeric" }) : "One way"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-400">Searched</dt>
                      <dd className="font-medium text-slate-800">{timeAgo(search.createdAt)}</dd>
                    </div>
                    <div className="col-span-3 flex flex-wrap gap-1.5">
                      {search.tripDuration && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                          {search.tripDuration === "custom" && search.customDays
                            ? `${search.customDays} days`
                            : durationLabels[search.tripDuration] ?? search.tripDuration}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          search.allowLayovers ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {search.allowLayovers ? "Layovers OK" : "Nonstop only"}
                      </span>
                    </div>
                  </dl>

                  {/* Actions */}
                  <div className="flex gap-2 md:flex-col">
                    <Link
                      href={resultsUrl(search)}
                      className="flex-1 rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-indigo-600"
                    >
                      Search again
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(search.id)}
                      disabled={deleting === search.id}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                    >
                      <TrashIcon width={14} height={14} />
                      {deleting === search.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
