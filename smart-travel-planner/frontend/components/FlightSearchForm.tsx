"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface Destination {
  id: string;
  code: string;
  name: string;
}

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

const commonAirports = [
  { code: "JFK", name: "New York (JFK)" },
  { code: "LAX", name: "Los Angeles (LAX)" },
  { code: "ORD", name: "Chicago (ORD)" },
  { code: "DFW", name: "Dallas (DFW)" },
  { code: "DEN", name: "Denver (DEN)" },
  { code: "SFO", name: "San Francisco (SFO)" },
  { code: "LAS", name: "Las Vegas (LAS)" },
  { code: "MIA", name: "Miami (MIA)" },
  { code: "BOS", name: "Boston (BOS)" },
  { code: "SEA", name: "Seattle (SEA)" },
];

const tripDurations = [
  { id: "weekend", label: "Weekend" },
  { id: "short", label: "3 Days" },
  { id: "medium", label: "5 Days" },
  { id: "week", label: "7 Days" },
  { id: "custom", label: "Custom" },
];

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

export default function FlightSearchForm() {
  const router = useRouter();
  const [homeAirport, setHomeAirport] = useState("");
  const [homeAirportInput, setHomeAirportInput] = useState("");
  const [showHomeAirportDropdown, setShowHomeAirportDropdown] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationInput, setDestinationInput] = useState("");
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [tripDuration, setTripDuration] = useState("");
  const [customDays, setCustomDays] = useState("");
  const [allowLayovers, setAllowLayovers] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarType, setCalendarType] = useState<"depart" | "return" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    void loadRecentSearches();
  }, []);

  const getFilteredAirports = (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return commonAirports.filter(
      (airport) =>
        airport.code.toLowerCase().includes(term) || airport.name.toLowerCase().includes(term)
    );
  };

  const filteredAirports = useMemo(() => getFilteredAirports(destinationInput), [destinationInput]);

  const filteredHomeAirports = useMemo(() => getFilteredAirports(homeAirportInput), [homeAirportInput]);

  const addDestination = (airport: (typeof commonAirports)[number]) => {
    if (!destinations.find((d) => d.code === airport.code)) {
      setDestinations([...destinations, { id: `${airport.code}-${Date.now()}`, ...airport }]);
    }
    setDestinationInput("");
    setShowDestinationDropdown(false);
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: Array<number | null> = [];

    for (let i = 0; i < startingDayOfWeek; i += 1) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i += 1) {
      days.push(i);
    }

    return days;
  };

  const handleDateSelect = (day: number | null) => {
    if (!day) return;

    const year = calendarMonth.getFullYear();
    const month = String(calendarMonth.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const formattedDate = `${year}-${month}-${dayStr}`;

    if (calendarType === "depart") {
      setDepartDate(formattedDate);
      setTripDuration("");
    } else if (calendarType === "return") {
      setReturnDate(formattedDate);
      setTripDuration("");
    }

    setCalendarType(null);
  };

  const handleDurationChange = (durationId: string) => {
    setTripDuration(durationId);

    if (!departDate) return;

    const [year, month, day] = departDate.split("-").map(Number);
    const depart = new Date(year, month - 1, day);
    const returnDateCalc = new Date(depart);

    switch (durationId) {
      case "weekend":
        returnDateCalc.setDate(returnDateCalc.getDate() + 2);
        break;
      case "short":
        returnDateCalc.setDate(returnDateCalc.getDate() + 3);
        break;
      case "medium":
        returnDateCalc.setDate(returnDateCalc.getDate() + 5);
        break;
      case "week":
        returnDateCalc.setDate(returnDateCalc.getDate() + 7);
        break;
      case "custom":
        setReturnDate("");
        return;
      default:
        return;
    }

    const resultYear = returnDateCalc.getFullYear();
    const resultMonth = String(returnDateCalc.getMonth() + 1).padStart(2, "0");
    const resultDay = String(returnDateCalc.getDate()).padStart(2, "0");
    setReturnDate(`${resultYear}-${resultMonth}-${resultDay}`);
  };

  const changeCalendarMonth = (delta: number) => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + delta, 1));
  };

  const loadRecentSearches = async () => {
    try {
      const response = await fetch("http://localhost:8081/api/flight-searches");
      if (!response.ok) throw new Error("Unable to load recent searches");
      const data = (await response.json()) as RecentSearch[];
      setRecentSearches(data);
    } catch {
      setRecentSearches([]);
    }
  };

  const applySavedSearch = (search: RecentSearch) => {
    setHomeAirport(search.homeAirport);
    setDestinations(
      search.destinations.split(",").map((code, index) => ({
        id: `${code}-${index}`,
        code,
        name: commonAirports.find((airport) => airport.code === code)?.name || code,
      }))
    );
    setDepartDate(search.departDate);
    setReturnDate(search.returnDate || "");
    setTripDuration(search.tripDuration || "");
    setCustomDays(search.customDays || "");
    setAllowLayovers(search.allowLayovers);
    setFeedback(`Loaded a saved plan for ${search.homeAirport}.`);
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();

    if (!homeAirport || destinations.length === 0 || !departDate) {
      setFeedback("Please complete the home airport, destination, and departure fields.");
      return;
    }

    setIsSubmitting(true);
    setFeedback("");

    try {
      const resultsUrl = `/results?${new URLSearchParams({
        homeAirport,
        destinations: destinations.map((destination) => destination.code).join(","),
        departDate,
        returnDate: returnDate || "",
        tripDuration,
        allowLayovers: allowLayovers ? "true" : "false",
      }).toString()}`;

      const response = await fetch("http://localhost:8081/api/flight-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeAirport,
          destinations: destinations.map((destination) => destination.code).join(","),
          departDate,
          returnDate: returnDate || null,
          tripDuration,
          customDays: customDays || null,
          allowLayovers,
        }),
      });

      if (!response.ok) throw new Error("Search could not be saved");

      const savedSearch = (await response.json()) as RecentSearch;
      setRecentSearches((previous) => [savedSearch, ...previous].slice(0, 6));
      setFeedback("Search saved successfully and sent to your backend.");
      router.push(resultsUrl);

      setHomeAirport("");
      setDestinations([]);
      setDestinationInput("");
      setDepartDate("");
      setReturnDate("");
      setTripDuration("");
      setCustomDays("");
      setAllowLayovers(false);
    } catch {
      setFeedback("The form is ready, but the backend was not reachable. Please ensure Spring Boot is running.");
      router.push(resultsUrl);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendarDays = generateCalendarDays(calendarMonth);
  const monthName = calendarMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSearch}
        className="mx-auto max-w-3xl overflow-visible rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur xl:p-8"
      >
        <div className="mb-6 flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-slate-900">Search your perfect trip</h2>
          <p className="text-sm text-slate-600">
            Find flights with flexible dates, multiple destinations, and your preferred layover settings.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Home airport</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by airport code or city"
                  value={homeAirportInput}
                  onChange={(event) => setHomeAirportInput(event.target.value)}
                  onFocus={() => setShowHomeAirportDropdown(true)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
                {homeAirport && (
                  <div className="mt-2 flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 w-fit">
                    <span>{homeAirport}</span>
                    <button type="button" onClick={() => {
                      setHomeAirport("");
                      setHomeAirportInput("");
                    }} className="text-blue-700 hover:text-blue-900">
                      ×
                    </button>
                  </div>
                )}
                {showHomeAirportDropdown && homeAirportInput && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {filteredHomeAirports.map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => {
                          setHomeAirport(airport.code);
                          setHomeAirportInput("");
                          setShowHomeAirportDropdown(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-blue-50"
                      >
                        <span>
                          <span className="font-semibold text-slate-900">{airport.code}</span> - {airport.name}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Destinations</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and add destinations"
                  value={destinationInput}
                  onChange={(event) => setDestinationInput(event.target.value)}
                  onFocus={() => setShowDestinationDropdown(true)}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                />
                {showDestinationDropdown && destinationInput && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
                    {filteredAirports.map((airport) => (
                      <button
                        key={airport.code}
                        type="button"
                        onClick={() => addDestination(airport)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-blue-50"
                      >
                        <span>
                          <span className="font-semibold text-slate-900">{airport.code}</span> - {airport.name}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {destinations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {destinations.map((destination) => (
                    <div key={destination.id} className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                      <span>{destination.code}</span>
                      <button type="button" onClick={() => removeDestination(destination.id)} className="text-blue-700 hover:text-blue-900">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Departure date</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarType("depart");
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 outline-none transition hover:bg-white focus:border-blue-500"
                >
                  {departDate ? formatDate(departDate) : "Choose departure date"}
                </button>
                {calendarType === "depart" && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <button type="button" onClick={() => changeCalendarMonth(-1)} className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100">
                        ←
                      </button>
                      <p className="text-sm font-semibold text-slate-800">{monthName}</p>
                      <button type="button" onClick={() => changeCalendarMonth(1)} className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100">
                        →
                      </button>
                    </div>
                    <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => (
                        <div key={day}>{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => (
                        <button
                          key={`${day ?? "empty"}-${index}`}
                          type="button"
                          onClick={() => handleDateSelect(day)}
                          disabled={!day}
                          className={`h-9 rounded-xl text-sm ${
                            day ? "hover:bg-blue-600 hover:text-white" : "cursor-default"
                          } ${day ? "bg-slate-50 text-slate-700" : "bg-transparent"}`}
                        >
                          {day ?? ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Trip duration</label>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {tripDurations.map((duration) => (
                  <button
                    key={duration.id}
                    type="button"
                    onClick={() => handleDurationChange(duration.id)}
                    className={`rounded-2xl px-3 py-2 text-sm font-medium transition ${
                      tripDuration === duration.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>
            </div>

            {tripDuration === "custom" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Custom number of days</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={customDays}
                  onChange={(event) => {
                    setCustomDays(event.target.value);
                    if (departDate && event.target.value) {
                      const [year, month, day] = departDate.split("-").map(Number);
                      const depart = new Date(year, month - 1, day);
                      const returnDateCalc = new Date(depart);
                      returnDateCalc.setDate(returnDateCalc.getDate() + Number(event.target.value));
                      const resultYear = returnDateCalc.getFullYear();
                      const resultMonth = String(returnDateCalc.getMonth() + 1).padStart(2, "0");
                      const resultDay = String(returnDateCalc.getDate()).padStart(2, "0");
                      setReturnDate(`${resultYear}-${resultMonth}-${resultDay}`);
                    }
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                  placeholder="Enter a custom trip length"
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Return date</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setCalendarType("return");
                  }}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 outline-none transition hover:bg-white focus:border-blue-500"
                >
                  {returnDate ? formatDate(returnDate) : "Choose return date"}
                </button>
                {calendarType === "return" && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                    <div className="mb-3 flex items-center justify-between">
                      <button type="button" onClick={() => changeCalendarMonth(-1)} className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100">
                        ←
                      </button>
                      <p className="text-sm font-semibold text-slate-800">{monthName}</p>
                      <button type="button" onClick={() => changeCalendarMonth(1)} className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100">
                        →
                      </button>
                    </div>
                    <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => (
                        <div key={day}>{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, index) => (
                        <button
                          key={`${day ?? "empty"}-${index}`}
                          type="button"
                          onClick={() => handleDateSelect(day)}
                          disabled={!day}
                          className={`h-9 rounded-xl text-sm ${
                            day ? "hover:bg-blue-600 hover:text-white" : "cursor-default"
                          } ${day ? "bg-slate-50 text-slate-700" : "bg-transparent"}`}
                        >
                          {day ?? ""}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allowLayovers}
                onChange={(event) => setAllowLayovers(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Allow layovers
            </label>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Search status</p>
            <p className="text-sm text-slate-600">{feedback || "Your search will be saved to the backend and reflected below."}</p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Saving search..." : "Search flights"}
          </button>
        </div>
      </form>

      <section className="mx-auto max-w-3xl rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.12)] xl:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Continue searching</p>
            <h3 className="mt-2 text-2xl font-semibold">Cached trip ideas</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Your most recent searches, saved from the backend for quick reuse.
            </p>
          </div>
          <div className="rounded-full border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            {recentSearches.length} saved searches
          </div>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {recentSearches.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-400 lg:col-span-2">
              Submit your first flight search to see it cached here.
            </div>
          ) : (
            recentSearches.map((search) => (
              <div key={search.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{search.homeAirport} → {search.destinations}</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Depart {formatDate(search.departDate)}{search.returnDate ? ` · Return ${formatDate(search.returnDate)}` : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                    {search.tripDuration || "Flexible"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-300">
                  <span className="rounded-full bg-white/10 px-3 py-1">{search.allowLayovers ? "Layovers allowed" : "Direct only"}</span>
                  {search.customDays ? <span className="rounded-full bg-white/10 px-3 py-1">{search.customDays} days</span> : null}
                </div>
                <button
                  type="button"
                  onClick={() => applySavedSearch(search)}
                  className="mt-5 rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-slate-950"
                >
                  Reuse search
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
