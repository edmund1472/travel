"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CompactFlightSearch from "@/components/CompactFlightSearch";
import FlightCard, { FlightCardSkeleton, type FlightBadge } from "@/components/FlightCard";
import SiteHeader from "@/components/SiteHeader";
import { AlertIcon, ArrowRightIcon, PlaneIcon, SlidersIcon } from "@/components/icons";
import { searchFlights, type Flight } from "@/lib/api";
import { cityFor } from "@/lib/airports";
import { durationMinutes, formatDate, formatPrice, formatShortDate } from "@/lib/format";

type SortOption = "best" | "price" | "duration";
type StopsFilter = "any" | "0" | "1";
type FailedDestination = { code: string; message: string };

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : "Something went wrong loading these flights.";
}

const timeWindows = [
  { id: "morning", label: "Morning", hint: "5a–12p", from: 5, to: 12 },
  { id: "afternoon", label: "Afternoon", hint: "12p–6p", from: 12, to: 18 },
  { id: "evening", label: "Evening", hint: "6p–12a", from: 18, to: 24 },
  { id: "night", label: "Overnight", hint: "12a–5a", from: 0, to: 5 },
];

function departureHour(flight: Flight) {
  return Number(flight.departureTime.split(" ")[1]?.split(":")[0] ?? 0);
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsShell />}>
      <FlightResults />
    </Suspense>
  );
}

function ResultsShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <SiteHeader />
      </div>
      {children ?? (
        <div className="mx-auto max-w-7xl space-y-3 px-4 py-8 sm:px-6 lg:px-8">
          {[0, 1, 2].map((i) => (
            <FlightCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function FlightResults() {
  const searchParams = useSearchParams();
  const homeAirport = searchParams.get("homeAirport") ?? "";
  const destinationsParam = searchParams.get("destinations") ?? "";
  const departDate = searchParams.get("departDate") ?? "";
  const returnDate = searchParams.get("returnDate") ?? "";
  const tripDuration = searchParams.get("tripDuration") ?? "";
  const allowLayovers = searchParams.get("allowLayovers") !== "false";
  const destinations = useMemo(() => destinationsParam.split(",").filter(Boolean), [destinationsParam]);

  const [flights, setFlights] = useState<Flight[]>([]);
  const [failed, setFailed] = useState<FailedDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sortBy, setSortBy] = useState<SortOption>("best");
  const [stops, setStops] = useState<StopsFilter>(allowLayovers ? "any" : "0");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [airlines, setAirlines] = useState<string[]>([]);
  const [windows, setWindows] = useState<string[]>([]);
  const [destinationFilter, setDestinationFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!homeAirport || destinations.length === 0 || !departDate) {
        setError("Your search is missing an origin, destination or date.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      setFailed([]);

      // One SerpAPI request per destination, run in parallel.
      const settled = await Promise.allSettled(destinations.map((d) => searchFlights(homeAirport, d, departDate)));
      if (cancelled) return;

      const merged: Flight[] = [];
      const failedDestinations: FailedDestination[] = [];
      settled.forEach((result, i) => {
        if (result.status === "fulfilled") merged.push(...result.value);
        else failedDestinations.push({ code: destinations[i], message: errorMessage(result.reason) });
      });

      if (failedDestinations.length === destinations.length) {
        // Every destination failed: show the shared reason once, or list each one.
        const messages = [...new Set(failedDestinations.map((f) => f.message))];
        setError(
          messages.length === 1
            ? messages[0]
            : failedDestinations.map((f) => `${cityFor(f.code) || f.code}: ${f.message}`).join(" ")
        );
      }
      setFlights(merged);
      setFailed(failedDestinations);
      // A new search starts with fresh filters.
      setStops(allowLayovers ? "any" : "0");
      setMaxPrice(null);
      setAirlines([]);
      setWindows([]);
      setDestinationFilter("all");
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [homeAirport, destinations, departDate, allowLayovers]);

  const priceCeiling = useMemo(() => Math.max(0, ...flights.map((f) => Math.ceil(f.price))), [flights]);
  const priceFloor = useMemo(
    () => (flights.length ? Math.min(...flights.filter((f) => f.price > 0).map((f) => Math.floor(f.price))) : 0),
    [flights]
  );
  const allAirlines = useMemo(() => {
    const counts = new Map<string, number>();
    flights.forEach((f) => counts.set(f.airline, (counts.get(f.airline) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [flights]);

  // Badges and "best" scoring are computed over every result, not just the filtered set.
  const { scores, badgeMap, summary } = useMemo(() => {
    const priced = flights.filter((f) => f.price > 0);
    const minPrice = Math.min(...priced.map((f) => f.price));
    const maxP = Math.max(...priced.map((f) => f.price));
    const mins = flights.map((f) => durationMinutes(f.duration));
    const minDur = Math.min(...mins);
    const maxDur = Math.max(...mins);
    const norm = (v: number, lo: number, hi: number) => (hi === lo ? 0 : (v - lo) / (hi - lo));

    const scoreMap = new Map<Flight, number>();
    flights.forEach((f, i) => {
      const priceScore = f.price > 0 ? norm(f.price, minPrice, maxP) : 1;
      scoreMap.set(f, priceScore * 0.6 + norm(mins[i], minDur, maxDur) * 0.3 + f.stops * 0.1);
    });

    const cheapest = [...priced].sort((a, b) => a.price - b.price)[0];
    const fastest = [...flights].sort((a, b) => durationMinutes(a.duration) - durationMinutes(b.duration))[0];
    const best = [...flights].sort((a, b) => scoreMap.get(a)! - scoreMap.get(b)!)[0];

    const badges = new Map<Flight, FlightBadge[]>();
    const add = (f: Flight | undefined, b: FlightBadge) => f && badges.set(f, [...(badges.get(f) ?? []), b]);
    add(best, "best");
    add(cheapest, "cheapest");
    add(fastest, "fastest");

    return { scores: scoreMap, badgeMap: badges, summary: { best, cheapest, fastest } };
  }, [flights]);

  const filtered = useMemo(() => {
    const limit = maxPrice ?? priceCeiling;
    const list = flights.filter((f) => {
      if (destinationFilter !== "all" && f.arrival !== destinationFilter) return false;
      if (stops !== "any" && f.stops > Number(stops)) return false;
      if (f.price > limit) return false;
      if (airlines.length && !airlines.includes(f.airline)) return false;
      if (windows.length) {
        const h = departureHour(f);
        if (!timeWindows.some((w) => windows.includes(w.id) && h >= w.from && h < w.to)) return false;
      }
      return true;
    });

    const byPrice = (a: Flight, b: Flight) => (a.price || Infinity) - (b.price || Infinity);
    if (sortBy === "price") list.sort(byPrice);
    else if (sortBy === "duration") list.sort((a, b) => durationMinutes(a.duration) - durationMinutes(b.duration));
    else list.sort((a, b) => scores.get(a)! - scores.get(b)!);
    return list;
  }, [flights, destinationFilter, stops, maxPrice, priceCeiling, airlines, windows, sortBy, scores]);

  const activeFilterCount =
    (stops !== "any" ? 1 : 0) +
    (maxPrice !== null && maxPrice < priceCeiling ? 1 : 0) +
    (airlines.length ? 1 : 0) +
    (windows.length ? 1 : 0) +
    (destinationFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setStops("any");
    setMaxPrice(null);
    setAirlines([]);
    setWindows([]);
    setDestinationFilter("all");
  };

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const sortTabs: Array<{ id: SortOption; label: string; flight?: Flight }> = [
    { id: "best", label: "Best", flight: summary.best },
    { id: "price", label: "Cheapest", flight: summary.cheapest },
    { id: "duration", label: "Fastest", flight: summary.fastest },
  ];

  return (
    <ResultsShell>
      {/* Search bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6 lg:px-8">
          <CompactFlightSearch
            key={searchParams.toString()}
            initial={{
              homeAirport,
              destinations,
              departDate,
              returnDate,
              tripDuration,
              allowLayovers,
            }}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Route heading */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {cityFor(homeAirport) || homeAirport}
              <ArrowRightIcon className="text-slate-400" />
              {destinations.map(cityFor).join(", ")}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {formatShortDate(departDate)}
              {returnDate && ` – ${formatShortDate(returnDate)}`} · showing outbound flights
            </p>
          </div>
          {!loading && !error && (
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900">{filtered.length}</span> of {flights.length} flights
            </p>
          )}
        </div>

        {error ? (
          <div className="flex flex-col items-center rounded-3xl border border-rose-200 bg-white px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
              <AlertIcon width={28} height={28} />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Something went wrong</h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">{error}</p>
            <Link href="/" className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
              Start a new search
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
            {/* Filters */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="mb-3 flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 lg:hidden"
              >
                <span className="flex items-center gap-2">
                  <SlidersIcon width={16} height={16} /> Filters
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-indigo-600 px-2 text-xs text-white">{activeFilterCount}</span>
                  )}
                </span>
                <span className="text-slate-400">{filtersOpen ? "Hide" : "Show"}</span>
              </button>

              <div className={`${filtersOpen ? "block" : "hidden"} space-y-6 rounded-3xl border border-slate-200 bg-white p-5 lg:block`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Filters</h2>
                  {activeFilterCount > 0 && (
                    <button type="button" onClick={resetFilters} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                      Reset
                    </button>
                  )}
                </div>

                {destinations.length > 1 && (
                  <FilterGroup title="Destination">
                    <div className="flex flex-wrap gap-2">
                      {["all", ...destinations].map((d) => (
                        <Chip key={d} active={destinationFilter === d} onClick={() => setDestinationFilter(d)}>
                          {d === "all" ? "All" : d}
                        </Chip>
                      ))}
                    </div>
                  </FilterGroup>
                )}

                <FilterGroup title="Stops">
                  <div className="space-y-1">
                    {(
                      [
                        ["any", "Any number of stops"],
                        ["0", "Nonstop only"],
                        ["1", "1 stop or fewer"],
                      ] as const
                    ).map(([id, label]) => (
                      <label key={id} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                        <input
                          type="radio"
                          name="stops"
                          checked={stops === id}
                          onChange={() => setStops(id)}
                          className="h-4 w-4 accent-indigo-600"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </FilterGroup>

                {priceCeiling > 0 && (
                  <FilterGroup title="Max price" aside={formatPrice(maxPrice ?? priceCeiling)}>
                    <input
                      type="range"
                      min={priceFloor}
                      max={priceCeiling}
                      step={5}
                      value={maxPrice ?? priceCeiling}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full cursor-pointer accent-indigo-600"
                    />
                    <div className="mt-1 flex justify-between text-xs text-slate-400">
                      <span>{formatPrice(priceFloor)}</span>
                      <span>{formatPrice(priceCeiling)}</span>
                    </div>
                  </FilterGroup>
                )}

                <FilterGroup title="Departure time">
                  <div className="grid grid-cols-2 gap-2">
                    {timeWindows.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setWindows((ws) => toggle(ws, w.id))}
                        className={`rounded-xl border px-2 py-2 text-left transition ${
                          windows.includes(w.id)
                            ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                            : "border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className="block text-sm font-medium">{w.label}</span>
                        <span className="block text-xs text-slate-500">{w.hint}</span>
                      </button>
                    ))}
                  </div>
                </FilterGroup>

                {allAirlines.length > 1 && (
                  <FilterGroup title="Airlines">
                    <div className="space-y-1">
                      {allAirlines.map(([name, count]) => (
                        <label key={name} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={airlines.includes(name)}
                            onChange={() => setAirlines((a) => toggle(a, name))}
                            className="h-4 w-4 rounded accent-indigo-600"
                          />
                          <span className="flex-1 truncate">{name}</span>
                          <span className="text-xs text-slate-400">{count}</span>
                        </label>
                      ))}
                    </div>
                  </FilterGroup>
                )}
              </div>
            </aside>

            {/* Results */}
            <section className="min-w-0">
              <div className="mb-4 grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {sortTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSortBy(tab.id)}
                    className={`relative px-3 py-3 text-left transition sm:px-5 ${
                      sortBy === tab.id ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <span className={`block text-sm font-semibold ${sortBy === tab.id ? "text-indigo-700" : "text-slate-700"}`}>
                      {tab.label}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {loading || !tab.flight ? "—" : `${formatPrice(tab.flight.price)} · ${tab.flight.duration}`}
                    </span>
                    {sortBy === tab.id && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-indigo-600" />}
                  </button>
                ))}
              </div>

              {failed.length > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertIcon width={16} height={16} className="mt-0.5 shrink-0" />
                  <div>
                    <p>Couldn&apos;t load flights to {failed.map((f) => cityFor(f.code) || f.code).join(", ")}. Showing the rest.</p>
                    <ul className="mt-1 space-y-0.5 text-amber-700">
                      {failed.map((f) => (
                        <li key={f.code}>
                          <span className="font-medium">{f.code}:</span> {f.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {loading ? (
                  <>
                    <p className="flex items-center gap-2 pb-1 text-sm text-slate-500">
                      <PlaneIcon width={16} height={16} className="animate-pulse text-indigo-500" />
                      Searching airlines for the best fares…
                    </p>
                    {[0, 1, 2, 3].map((i) => (
                      <FlightCardSkeleton key={i} />
                    ))}
                  </>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                      <PlaneIcon width={28} height={28} />
                    </span>
                    <h2 className="mt-4 text-lg font-semibold text-slate-900">
                      {flights.length === 0 ? "No flights found" : "No flights match your filters"}
                    </h2>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                      {flights.length === 0
                        ? `We didn't find flights for ${formatDate(departDate)}. Try a nearby date or another airport.`
                        : "Try loosening your stops, price or time filters."}
                    </p>
                    {flights.length > 0 && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  filtered.map((flight, i) => (
                    <FlightCard key={`${flight.id}-${flight.departureTime}-${i}`} flight={flight} badges={badgeMap.get(flight)} />
                  ))
                )}
              </div>

              {!loading && filtered.length > 0 && (
                <p className="mt-6 text-center text-xs text-slate-400">
                  Prices in USD from Google Flights. Fares may change until booked.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </ResultsShell>
  );
}

function FilterGroup({ title, aside, children }: { title: string; aside?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-100 pt-5 first-of-type:border-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        {aside && <span className="text-sm font-semibold text-slate-900">{aside}</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
        active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
