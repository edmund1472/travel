export interface Airport {
  code: string;
  city: string;
  name: string;
  country: string;
}

export const airports: Airport[] = [
  // City codes: the backend expands these into every airport in the metro area.
  { code: "NYC", city: "New York", name: "All airports (JFK, EWR, LGA)", country: "USA" },
  { code: "WAS", city: "Washington", name: "All airports (IAD, DCA, BWI)", country: "USA" },
  { code: "CHI", city: "Chicago", name: "All airports (ORD, MDW)", country: "USA" },
  { code: "LON", city: "London", name: "All airports (LHR, LGW, STN, LTN, LCY)", country: "UK" },
  { code: "PAR", city: "Paris", name: "All airports (CDG, ORY)", country: "France" },
  { code: "TYO", city: "Tokyo", name: "All airports (HND, NRT)", country: "Japan" },
  { code: "JFK", city: "New York", name: "John F. Kennedy Intl", country: "USA" },
  { code: "EWR", city: "Newark", name: "Newark Liberty Intl", country: "USA" },
  { code: "LGA", city: "New York", name: "LaGuardia", country: "USA" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles Intl", country: "USA" },
  { code: "SFO", city: "San Francisco", name: "San Francisco Intl", country: "USA" },
  { code: "SEA", city: "Seattle", name: "Seattle–Tacoma Intl", country: "USA" },
  { code: "ORD", city: "Chicago", name: "O'Hare Intl", country: "USA" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth Intl", country: "USA" },
  { code: "DEN", city: "Denver", name: "Denver Intl", country: "USA" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield–Jackson Intl", country: "USA" },
  { code: "MIA", city: "Miami", name: "Miami Intl", country: "USA" },
  { code: "BOS", city: "Boston", name: "Logan Intl", country: "USA" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid Intl", country: "USA" },
  { code: "PHX", city: "Phoenix", name: "Sky Harbor Intl", country: "USA" },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental", country: "USA" },
  { code: "MCO", city: "Orlando", name: "Orlando Intl", country: "USA" },
  { code: "MSP", city: "Minneapolis", name: "Minneapolis–Saint Paul Intl", country: "USA" },
  { code: "DTW", city: "Detroit", name: "Detroit Metro Wayne County", country: "USA" },
  { code: "PHL", city: "Philadelphia", name: "Philadelphia Intl", country: "USA" },
  { code: "IAD", city: "Washington", name: "Dulles Intl", country: "USA" },
  { code: "SAN", city: "San Diego", name: "San Diego Intl", country: "USA" },
  { code: "HNL", city: "Honolulu", name: "Daniel K. Inouye Intl", country: "USA" },
  { code: "YYZ", city: "Toronto", name: "Pearson Intl", country: "Canada" },
  { code: "YVR", city: "Vancouver", name: "Vancouver Intl", country: "Canada" },
  { code: "MEX", city: "Mexico City", name: "Benito Juárez Intl", country: "Mexico" },
  { code: "CUN", city: "Cancún", name: "Cancún Intl", country: "Mexico" },
  { code: "LHR", city: "London", name: "Heathrow", country: "UK" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "France" },
  { code: "AMS", city: "Amsterdam", name: "Schiphol", country: "Netherlands" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt am Main", country: "Germany" },
  { code: "MAD", city: "Madrid", name: "Adolfo Suárez Barajas", country: "Spain" },
  { code: "BCN", city: "Barcelona", name: "El Prat", country: "Spain" },
  { code: "FCO", city: "Rome", name: "Fiumicino", country: "Italy" },
  { code: "LIS", city: "Lisbon", name: "Humberto Delgado", country: "Portugal" },
  { code: "DUB", city: "Dublin", name: "Dublin", country: "Ireland" },
  { code: "IST", city: "Istanbul", name: "Istanbul", country: "Türkiye" },
  { code: "DXB", city: "Dubai", name: "Dubai Intl", country: "UAE" },
  { code: "HND", city: "Tokyo", name: "Haneda", country: "Japan" },
  { code: "NRT", city: "Tokyo", name: "Narita Intl", country: "Japan" },
  { code: "ICN", city: "Seoul", name: "Incheon Intl", country: "South Korea" },
  { code: "HKG", city: "Hong Kong", name: "Hong Kong Intl", country: "Hong Kong" },
  { code: "SIN", city: "Singapore", name: "Changi", country: "Singapore" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand" },
  { code: "SYD", city: "Sydney", name: "Kingsford Smith", country: "Australia" },
  { code: "GRU", city: "São Paulo", name: "Guarulhos Intl", country: "Brazil" },
];

export function findAirport(code: string) {
  return airports.find((airport) => airport.code === code.toUpperCase());
}

export function searchAirports(term: string, exclude: string[] = []) {
  const query = term.trim().toLowerCase();
  if (!query) return [];
  return airports
    .filter((airport) => !exclude.includes(airport.code))
    .filter(
      (airport) =>
        airport.code.toLowerCase().startsWith(query) ||
        airport.city.toLowerCase().includes(query) ||
        airport.name.toLowerCase().includes(query) ||
        airport.country.toLowerCase().includes(query)
    )
    .sort((a, b) => Number(b.code.toLowerCase() === query) - Number(a.code.toLowerCase() === query))
    .slice(0, 8);
}

export function cityFor(code: string) {
  return findAirport(code)?.city ?? code;
}
