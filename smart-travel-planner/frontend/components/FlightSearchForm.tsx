"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { resultsUrl, saveSearch, type NewSearch } from "@/lib/api";
import { addDays } from "@/lib/format";
import AirportInput from "./AirportInput";
import DatePicker from "./DatePicker";
import { AlertIcon, LandingIcon, SearchIcon, SwapIcon, TakeoffIcon } from "./icons";

export interface SearchValues {
  homeAirport: string;
  destinations: string[];
  departDate: string;
  returnDate: string;
  tripDuration: string;
  customDays: string;
  allowLayovers: boolean;
}

const tripDurations = [
  { id: "weekend", label: "Weekend", days: 2 },
  { id: "short", label: "3 days", days: 3 },
  { id: "medium", label: "5 days", days: 5 },
  { id: "week", label: "1 week", days: 7 },
  { id: "custom", label: "Custom", days: 0 },
];

const empty: SearchValues = {
  homeAirport: "",
  destinations: [],
  departDate: "",
  returnDate: "",
  tripDuration: "",
  customDays: "",
  allowLayovers: true,
};

interface FlightSearchFormProps {
  initial?: Partial<SearchValues>;
  variant?: "hero" | "compact";
  onSaved?: () => void;
}

export default function FlightSearchForm({ initial, variant = "hero", onSaved }: FlightSearchFormProps) {
  const router = useRouter();
  const compact = variant === "compact";
  const [values, setValues] = useState<SearchValues>({ ...empty, ...initial });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const set = <K extends keyof SearchValues>(key: K, value: SearchValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const returnFor = (departDate: string, durationId: string, customDays: string) => {
    if (!departDate) return "";
    const days = durationId === "custom" ? Number(customDays) : tripDurations.find((d) => d.id === durationId)?.days;
    return days ? addDays(departDate, days) : "";
  };

  const setDepart = (departDate: string) =>
    setValues((v) => {
      const recalculated = v.tripDuration ? returnFor(departDate, v.tripDuration, v.customDays) : "";
      // Keep a manually picked return date unless it now falls before departure.
      const returnDate = recalculated || (v.returnDate && v.returnDate >= departDate ? v.returnDate : "");
      return { ...v, departDate, returnDate };
    });

  const setDuration = (id: string) =>
    setValues((v) => {
      const tripDuration = v.tripDuration === id ? "" : id;
      return { ...v, tripDuration, returnDate: tripDuration ? returnFor(v.departDate, tripDuration, v.customDays) : v.returnDate };
    });

  const swap = () =>
    setValues((v) =>
      v.destinations.length === 1 && v.homeAirport
        ? { ...v, homeAirport: v.destinations[0], destinations: [v.homeAirport] }
        : v
    );

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!values.homeAirport) return setError("Choose where you're flying from.");
    if (values.destinations.length === 0) return setError("Add at least one destination.");
    if (!values.departDate) return setError("Pick a departure date.");
    setError("");
    setIsSubmitting(true);

    const search: NewSearch = {
      homeAirport: values.homeAirport,
      destinations: values.destinations.join(","),
      departDate: values.departDate,
      returnDate: values.returnDate || null,
      tripDuration: values.tripDuration,
      customDays: values.customDays || null,
      allowLayovers: values.allowLayovers,
    };

    try {
      await saveSearch(search);
      onSaved?.();
    } catch (err) {
      // Saving history is best effort; still take the traveler to their results.
      console.error(err);
    }

    router.push(resultsUrl(search));
    setIsSubmitting(false);
  };

  const canSwap = values.destinations.length === 1 && !!values.homeAirport;

  return (
    <form
      onSubmit={handleSearch}
      className={`relative rounded-3xl bg-white ${
        compact
          ? "border border-slate-200 p-3 shadow-sm"
          : "p-4 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-900/5 sm:p-6"
      }`}
    >
      <div className={`grid gap-2 ${compact ? "lg:grid-cols-[1fr_1.3fr_0.9fr_0.9fr_auto]" : "md:grid-cols-2 lg:grid-cols-[1fr_1.3fr_0.9fr_0.9fr]"}`}>
        <div className="relative">
          <AirportInput
            label="From"
            icon={<TakeoffIcon width={18} height={18} />}
            placeholder="City or airport"
            value={values.homeAirport ? [values.homeAirport] : []}
            onChange={(codes) => set("homeAirport", codes[0] ?? "")}
            exclude={values.destinations}
            compact={compact}
          />
          <button
            type="button"
            onClick={swap}
            disabled={!canSwap}
            aria-label="Swap origin and destination"
            className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:rotate-180 hover:text-indigo-600 disabled:opacity-0 md:grid"
          >
            <SwapIcon width={14} height={14} />
          </button>
        </div>
        <AirportInput
          label={values.destinations.length > 1 ? `To · ${values.destinations.length} places` : "To"}
          icon={<LandingIcon width={18} height={18} />}
          placeholder="Where to? Add several"
          value={values.destinations}
          onChange={(codes) => set("destinations", codes)}
          exclude={values.homeAirport ? [values.homeAirport] : []}
          multiple
          compact={compact}
        />
        <DatePicker
          label="Depart"
          value={values.departDate}
          onChange={setDepart}
          rangeStart={values.departDate}
          rangeEnd={values.returnDate}
          compact={compact}
        />
        <DatePicker
          label="Return"
          value={values.returnDate}
          onChange={(date) => setValues((v) => ({ ...v, returnDate: date, tripDuration: "" }))}
          placeholder="One way"
          min={values.departDate}
          rangeStart={values.departDate}
          rangeEnd={values.returnDate}
          clearable
          compact={compact}
        />

        {compact && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-70"
          >
            <SearchIcon width={18} height={18} />
            <span className="lg:sr-only xl:not-sr-only">{isSubmitting ? "Searching…" : "Search"}</span>
          </button>
        )}
      </div>

      {!compact && (
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-medium text-slate-500">Trip length</span>
            {tripDurations.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDuration(d.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  values.tripDuration === d.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {d.label}
              </button>
            ))}
            {values.tripDuration === "custom" && (
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={values.customDays}
                  onChange={(e) => {
                    const customDays = e.target.value;
                    setValues((v) => ({ ...v, customDays, returnDate: returnFor(v.departDate, "custom", customDays) }));
                  }}
                  placeholder="Days"
                  className="w-20 rounded-full border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                />
                <span className="text-sm text-slate-500">days</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer select-none items-center gap-2.5 text-sm font-medium text-slate-700">
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  checked={!values.allowLayovers}
                  onChange={(e) => set("allowLayovers", !e.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-indigo-600 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20" />
                <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
              Nonstop only
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-xl disabled:translate-y-0 disabled:opacity-70 lg:flex-none"
            >
              <SearchIcon width={18} height={18} />
              {isSubmitting ? "Searching…" : "Search flights"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          <AlertIcon width={16} height={16} />
          {error}
        </p>
      )}
    </form>
  );
}
