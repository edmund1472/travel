/* eslint-disable @next/next/no-img-element -- airline logos come from arbitrary SerpAPI hosts */
import type { Flight } from "@/lib/api";
import { cityFor } from "@/lib/airports";
import { dayOffset, formatPrice, formatTime, stopsLabel } from "@/lib/format";
import { PlaneIcon } from "./icons";

export type FlightBadge = "cheapest" | "fastest" | "best";

const badgeStyles: Record<FlightBadge, { label: string; className: string }> = {
  best: { label: "Best value", className: "bg-indigo-600 text-white" },
  cheapest: { label: "Cheapest", className: "bg-emerald-100 text-emerald-800" },
  fastest: { label: "Fastest", className: "bg-amber-100 text-amber-800" },
};

export default function FlightCard({ flight, badges = [] }: { flight: Flight; badges?: FlightBadge[] }) {
  const plusDays = dayOffset(flight.departureTime, flight.arrivalTime);
  const highlighted = badges.includes("best");

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 ${
        highlighted ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200"
      }`}
    >
      {badges.length > 0 && (
        <div className="flex gap-1.5 px-5 pt-4">
          {badges.map((b) => (
            <span key={b} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[b].className}`}>
              {badgeStyles[b].label}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
        {/* Airline */}
        <div className="flex items-center gap-3 sm:w-44 sm:shrink-0">
          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-slate-100 bg-white">
            {flight.airlineLogo ? (
              <img src={flight.airlineLogo} alt="" className="h-8 w-8 object-contain" />
            ) : (
              <PlaneIcon className="text-slate-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{flight.airline}</p>
            {flight.id && <p className="text-xs text-slate-400">{flight.id}</p>}
          </div>
        </div>

        {/* Timeline */}
        <div className="flex flex-1 items-center gap-3 sm:gap-4">
          <div className="text-left">
            <p className="text-xl font-semibold tabular-nums text-slate-900">{formatTime(flight.departureTime)}</p>
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{flight.departure}</span> · {cityFor(flight.departure)}
            </p>
          </div>

          <div className="flex min-w-16 flex-1 flex-col items-center gap-1 px-1">
            <span className="text-xs font-medium text-slate-500">{flight.duration}</span>
            <div className="relative flex w-full items-center">
              <span className="h-2 w-2 rounded-full border-2 border-slate-300 bg-white" />
              <span className="h-px flex-1 bg-slate-300" />
              {Array.from({ length: flight.stops }).map((_, i) => (
                <span key={i} className="flex flex-1 items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="h-px flex-1 bg-slate-300" />
                </span>
              ))}
              <PlaneIcon width={16} height={16} className="rotate-45 text-slate-400 transition group-hover:text-indigo-500" />
            </div>
            <span className={`text-xs font-medium ${flight.stops === 0 ? "text-emerald-600" : "text-amber-600"}`}>
              {stopsLabel(flight.stops)}
            </span>
          </div>

          <div className="text-right">
            <p className="text-xl font-semibold tabular-nums text-slate-900">
              {formatTime(flight.arrivalTime)}
              {plusDays > 0 && <sup className="ml-0.5 text-xs font-semibold text-rose-500">+{plusDays}</sup>}
            </p>
            <p className="text-sm text-slate-500">
              {cityFor(flight.arrival)} · <span className="font-semibold text-slate-700">{flight.arrival}</span>
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between gap-4 border-t border-dashed border-slate-200 pt-4 sm:w-40 sm:shrink-0 sm:flex-col sm:items-end sm:justify-center sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <div className="sm:text-right">
            <p className="text-2xl font-bold tracking-tight text-slate-900">{formatPrice(flight.price)}</p>
            <p className="text-xs text-slate-500">one way</p>
          </div>
          <button
            type="button"
            className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            Select
          </button>
        </div>
      </div>
    </article>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 sm:w-44">
          <div className="h-11 w-11 rounded-xl bg-slate-100" />
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-2.5 w-12 rounded bg-slate-100" />
          </div>
        </div>
        <div className="flex flex-1 items-center gap-4">
          <div className="h-10 w-20 rounded-lg bg-slate-100" />
          <div className="h-px flex-1 bg-slate-100" />
          <div className="h-10 w-20 rounded-lg bg-slate-100" />
        </div>
        <div className="flex flex-col items-end gap-2 sm:w-40">
          <div className="h-7 w-20 rounded-lg bg-slate-100" />
          <div className="h-8 w-24 rounded-xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
