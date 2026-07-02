"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Destination {
  id: string;
  code: string;
  name: string;
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

export default function CompactFlightSearch() {
  const router = useRouter();
  const [homeAirport, setHomeAirport] = useState("");
  const [homeAirportInput, setHomeAirportInput] = useState("");
  const [showHomeAirportDropdown, setShowHomeAirportDropdown] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationInput, setDestinationInput] = useState("");
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const getFilteredAirports = (searchTerm: string) => {
    const term = searchTerm.toLowerCase();
    return commonAirports.filter(
      (airport) =>
        airport.code.toLowerCase().includes(term) || airport.name.toLowerCase().includes(term)
    );
  };

  const filteredHomeAirports = getFilteredAirports(homeAirportInput);
  const filteredDestinations = getFilteredAirports(destinationInput);

  const addDestination = (airport: (typeof commonAirports)[0]) => {
    if (!destinations.find((d) => d.code === airport.code)) {
      setDestinations([...destinations, { id: `${airport.code}-${Date.now()}`, ...airport }]);
    }
    setDestinationInput("");
    setShowDestinationDropdown(false);
  };

  const removeDestination = (id: string) => {
    setDestinations(destinations.filter((d) => d.id !== id));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeAirport || destinations.length === 0 || !departDate) {
      alert("Please fill in all required fields");
      return;
    }
    // Redirect to results page with search params
    router.push(`/results`);
  };

  return (
    <form onSubmit={handleSearch} className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg backdrop-blur">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Search your perfect trip</h2>
        <p className="text-xs text-slate-600">Modify your search or explore more options</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Home Airport */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Home airport</label>
          <input
            type="text"
            placeholder="Search airport"
            value={homeAirportInput}
            onChange={(e) => setHomeAirportInput(e.target.value)}
            onFocus={() => setShowHomeAirportDropdown(true)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
          {homeAirport && (
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
              <span>{homeAirport}</span>
              <button
                type="button"
                onClick={() => {
                  setHomeAirport("");
                  setHomeAirportInput("");
                }}
                className="text-blue-700 hover:text-blue-900"
              >
                ×
              </button>
            </div>
          )}
          {showHomeAirportDropdown && homeAirportInput && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {filteredHomeAirports.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => {
                    setHomeAirport(airport.code);
                    setHomeAirportInput("");
                    setShowHomeAirportDropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition"
                >
                  <span className="font-semibold">{airport.code}</span> - {airport.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Destinations */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Destinations</label>
          <input
            type="text"
            placeholder="Add destination"
            value={destinationInput}
            onChange={(e) => setDestinationInput(e.target.value)}
            onFocus={() => setShowDestinationDropdown(true)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
          {destinations.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {destinations.map((dest) => (
                <div key={dest.id} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  <span>{dest.code}</span>
                  <button type="button" onClick={() => removeDestination(dest.id)} className="text-blue-700 hover:text-blue-900">
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {showDestinationDropdown && destinationInput && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {filteredDestinations.map((airport) => (
                <button
                  key={airport.code}
                  type="button"
                  onClick={() => addDestination(airport)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 transition"
                >
                  <span className="font-semibold">{airport.code}</span> - {airport.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Departure Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Depart</label>
          <input
            type="date"
            value={departDate}
            onChange={(e) => setDepartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Return Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Return</label>
          <input
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </div>

        {/* Search Button */}
        <div className="flex items-end">
          <button type="submit" className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 transition-colors text-sm">
            Search
          </button>
        </div>
      </div>
    </form>
  );
}
