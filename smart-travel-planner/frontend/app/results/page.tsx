"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import CompactFlightSearch from "@/components/CompactFlightSearch";

interface Flight {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  rating: number;
}

const mockFlights: Flight[] = [
  {
    id: "1",
    airline: "Delta Airlines",
    departure: "JFK",
    arrival: "LAX",
    departureTime: "08:00 AM",
    arrivalTime: "11:30 AM",
    duration: "5h 30m",
    stops: 0,
    price: 245,
    rating: 4.5,
  },
  {
    id: "2",
    airline: "United Airlines",
    departure: "JFK",
    arrival: "LAX",
    departureTime: "10:15 AM",
    arrivalTime: "02:45 PM",
    duration: "5h 30m",
    stops: 0,
    price: 289,
    rating: 4.3,
  },
  {
    id: "3",
    airline: "American Airlines",
    departure: "JFK",
    arrival: "LAX",
    departureTime: "12:30 PM",
    arrivalTime: "04:00 PM",
    duration: "5h 30m",
    stops: 1,
    price: 199,
    rating: 4.1,
  },
  {
    id: "4",
    airline: "Southwest Airlines",
    departure: "JFK",
    arrival: "LAX",
    departureTime: "02:00 PM",
    arrivalTime: "06:30 PM",
    duration: "5h 30m",
    stops: 1,
    price: 175,
    rating: 3.9,
  },
  {
    id: "5",
    airline: "JetBlue Airways",
    departure: "JFK",
    arrival: "LAX",
    departureTime: "04:45 PM",
    arrivalTime: "08:15 PM",
    duration: "5h 30m",
    stops: 0,
    price: 320,
    rating: 4.6,
  },
  {
    id: "6",
    airline: "Spirit Airlines",
    departure: "JFK",
    arrival: "LAX",
    departureTime: "06:00 PM",
    arrivalTime: "10:30 PM",
    duration: "5h 30m",
    stops: 2,
    price: 129,
    rating: 3.2,
  },
];

type SortOption = "price-low" | "price-high" | "duration" | "rating";
type FilterStops = "all" | "0" | "1" | "2+";

export default function FlightResults() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeAirport = searchParams?.get("homeAirport") ?? "";
  const destinations = searchParams?.get("destinations")?.split(",").filter(Boolean) ?? [];
  const departDate = searchParams?.get("departDate") ?? "";
  const returnDate = searchParams?.get("returnDate") ?? "";

  const [flights, setFlights] = useState<Flight[]>(mockFlights);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>(mockFlights);
  const [sortBy, setSortBy] = useState<SortOption>("price-low");
  const [maxPrice, setMaxPrice] = useState(500);
  const [stops, setStops] = useState<FilterStops>("all");

  useEffect(() => {
    const home = searchParams?.get("homeAirport");
    const destinationParam = searchParams?.get("destinations");
    let initialFlights = [...mockFlights];

    if (home) {
      initialFlights = initialFlights.filter((flight) => flight.departure === home);
    }

    if (destinationParam) {
      const destinationValues = destinationParam.split(",").filter(Boolean);
      if (destinationValues.length > 0) {
        initialFlights = initialFlights.filter((flight) => destinationValues.includes(flight.arrival));
      }
    }

    setFlights(initialFlights);
    setFilteredFlights(initialFlights);
  }, [searchParams]);

  const searchSummary = homeAirport && destinations.length > 0
    ? `Showing results from ${homeAirport} to ${destinations.join(", ")} on ${departDate || "your selected dates"}`
    : "Showing all available flights";

  useEffect(() => {
    let filtered = [...flights];

    // Filter by price
    filtered = filtered.filter((flight) => flight.price <= maxPrice);

    // Filter by stops
    if (stops !== "all") {
      if (stops === "2+") {
        filtered = filtered.filter((flight) => flight.stops >= 2);
      } else {
        filtered = filtered.filter((flight) => flight.stops === Number(stops));
      }
    }

    // Sort
    if (sortBy === "price-low") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === "duration") {
      filtered.sort((a, b) => {
        const aDuration = Number(a.duration.split("h")[0]) * 60 + Number(a.duration.split("m")[0].split(" ").pop());
        const bDuration = Number(b.duration.split("h")[0]) * 60 + Number(b.duration.split("m")[0].split(" ").pop());
        return aDuration - bDuration;
      });
    } else if (sortBy === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    }

    setFilteredFlights(filtered);
  }, [maxPrice, stops, sortBy, flights]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Compact Search Form at Top */}
        <div className="mb-12">
          <CompactFlightSearch />
        </div>

        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-600">{searchSummary}</p>
              {departDate && (
                <p className="mt-2 text-xs text-slate-500">
                  Depart: {departDate}{returnDate ? ` • Return: ${returnDate}` : ""}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
            >
              Back to search
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg lg:col-span-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Filters & Sort</h3>

            {/* Sort Dropdown */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              >
                <option value="price-low">Price (Low to High)</option>
                <option value="price-high">Price (High to Low)</option>
                <option value="duration">Shortest Duration</option>
                <option value="rating">Best Rating</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Max Price</label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
                <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
                  ${maxPrice}
                </div>
              </div>
            </div>

            {/* Stops Filter */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Stops</label>
              <select
                value={stops}
                onChange={(e) => setStops(e.target.value as FilterStops)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              >
                <option value="all">All Stops</option>
                <option value="0">Non-stop</option>
                <option value="1">1 Stop</option>
                <option value="2+">2+ Stops</option>
              </select>
            </div>

            {/* Results count */}
            <div className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700 font-medium">
              {filteredFlights.length} flight{filteredFlights.length !== 1 ? "s" : ""} found
            </div>
          </div>

          {/* Flights List */}
          <div className="lg:col-span-3 space-y-4">
            {filteredFlights.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <p className="text-slate-600 font-medium">No flights match your filters</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your price range or stops</p>
              </div>
            ) : (
              filteredFlights.map((flight) => (
                <div key={flight.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Flight Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                          {flight.airline}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-yellow-500">
                          {"★".repeat(Math.floor(flight.rating))}
                          <span className="text-slate-500">({flight.rating})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 mb-2">
                        <div>
                          <p className="text-2xl font-bold text-slate-900">{flight.departureTime}</p>
                          <p className="text-sm text-slate-600">{flight.departure}</p>
                        </div>
                        <div className="flex-1 border-t-2 border-slate-300 flex items-center justify-center">
                          <div className="text-xs text-slate-600 font-medium bg-slate-100 px-2 py-1 rounded">
                            {flight.duration} • {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-slate-900">{flight.arrivalTime}</p>
                          <p className="text-sm text-slate-600">{flight.arrival}</p>
                        </div>
                      </div>
                    </div>

                    {/* Price and Book */}
                    <div className="flex flex-col items-end gap-3 pt-4 border-t lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                      <div className="text-right">
                        <p className="text-sm text-slate-600">From</p>
                        <p className="text-3xl font-bold text-blue-600">${flight.price}</p>
                      </div>
                      <button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 transition-colors">
                        Select
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
