"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import FlightSearchForm, { type SearchValues } from "@/components/FlightSearchForm";
import SiteHeader from "@/components/SiteHeader";
import { ArrowRightIcon, ClockIcon, LandingIcon, PlaneIcon, SearchIcon, SlidersIcon } from "@/components/icons";
import { listSearches, resultsUrl, type SavedSearch } from "@/lib/api";
import { cityFor } from "@/lib/airports";
import { formatDate, timeAgo } from "@/lib/format";

const popular = [
  { code: "CDG", city: "Paris", tagline: "Cafés & the Seine", gradient: "from-rose-400 via-fuchsia-500 to-indigo-600" },
  { code: "HND", city: "Tokyo", tagline: "Neon nights, quiet temples", gradient: "from-sky-400 via-indigo-500 to-violet-700" },
  { code: "CUN", city: "Cancún", tagline: "Turquoise water", gradient: "from-cyan-300 via-teal-400 to-emerald-600" },
  { code: "LIS", city: "Lisbon", tagline: "Hills, trams & tiles", gradient: "from-amber-300 via-orange-400 to-rose-500" },
];

export default function Home() {
  const [recent, setRecent] = useState<SavedSearch[]>([]);
  const [recentLoaded, setRecentLoaded] = useState(false);
  const [preset, setPreset] = useState<{ key: number; values: Partial<SearchValues> }>({ key: 0, values: {} });

  const loadRecent = useCallback(
    () =>
      listSearches()
        .then((searches) => setRecent(searches.slice(0, 6)))
        .catch(() => setRecent([]))
        .finally(() => setRecentLoaded(true)),
    []
  );

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const pickDestination = (code: string) => {
    setPreset((p) => ({ key: p.key + 1, values: { homeAirport: recent[0]?.homeAirport ?? "", destinations: [code] } }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-950 pb-40">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-indigo-600/40 blur-3xl" />
          <div className="absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full bg-sky-500/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0H0v40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          <svg className="absolute right-0 top-16 hidden w-[42rem] text-white/30 lg:block" viewBox="0 0 600 200" fill="none" aria-hidden>
            <path d="M10 180C150 40 380 0 590 60" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" />
          </svg>
        </div>

        <SiteHeader variant="dark" />

        <div className="relative mx-auto max-w-7xl px-4 pt-14 sm:px-6 sm:pt-20 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-sky-200 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live fares from Google Flights
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Find your next flight,{" "}
            <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
              without the noise.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-300">
            Compare several destinations at once, filter by what matters, and keep every search in one place.
          </p>
        </div>
      </section>

      {/* Search card overlapping the hero */}
      <div className="relative z-20 mx-auto -mt-32 max-w-7xl px-4 sm:px-6 lg:px-8">
        <FlightSearchForm key={preset.key} initial={preset.values} onSaved={loadRecent} />
      </div>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-20 sm:px-6 lg:px-8">
        {/* Recent searches */}
        {recentLoaded && recent.length > 0 && (
          <section>
            <SectionHeading
              eyebrow="Pick up where you left off"
              title="Recent searches"
              action={
                <Link href="/history" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                  View all <ArrowRightIcon width={16} height={16} />
                </Link>
              }
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.map((search) => (
                <Link
                  key={search.id}
                  href={resultsUrl(search)}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon width={13} height={13} /> {timeAgo(search.createdAt)}
                    </span>
                    {!search.allowLayovers && <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">Nonstop</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="text-xl font-semibold text-slate-900">{search.homeAirport}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
                    <PlaneIcon width={16} height={16} className="rotate-45 text-slate-400 transition group-hover:text-indigo-500" />
                    <span className="h-px flex-1 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />
                    <span className="text-xl font-semibold text-slate-900">
                      {search.destinations.split(",")[0]}
                      {search.destinations.includes(",") && (
                        <span className="ml-1 text-sm font-medium text-slate-400">+{search.destinations.split(",").length - 1}</span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-slate-500">
                    <span>{cityFor(search.homeAirport)}</span>
                    <span>{search.destinations.split(",").map(cityFor).join(", ")}</span>
                  </div>
                  <p className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    {formatDate(search.departDate, { month: "short", day: "numeric" })}
                    {search.returnDate ? ` – ${formatDate(search.returnDate, { month: "short", day: "numeric" })}` : " · One way"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Inspiration */}
        <section>
          <SectionHeading eyebrow="Need ideas?" title="Popular right now" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => pickDestination(p.code)}
                className={`group relative flex h-56 flex-col justify-end overflow-hidden rounded-3xl bg-gradient-to-br ${p.gradient} p-6 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl`}
              >
                <span className="absolute right-5 top-5 rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold tracking-wider backdrop-blur">
                  {p.code}
                </span>
                <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 transition group-hover:scale-125" />
                <span className="text-2xl font-semibold">{p.city}</span>
                <span className="text-sm text-white/80">{p.tagline}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold opacity-0 transition group-hover:opacity-100">
                  Search flights <ArrowRightIcon width={16} height={16} />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 sm:grid-cols-3">
          {[
            { icon: LandingIcon, title: "Many destinations, one search", body: "Add several cities and compare every fare side by side." },
            { icon: SlidersIcon, title: "Filters that matter", body: "Stops, price, airline and departure time — narrowed in a click." },
            { icon: SearchIcon, title: "Every search saved", body: "Your history is stored so you can rerun a trip any time." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon width={20} height={20} />
              </span>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        Skyward · Smart travel planner
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-indigo-600">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
