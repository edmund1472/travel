export const API_BASE = "http://localhost:8081";

export interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
}

export interface SavedSearch {
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

export type NewSearch = Omit<SavedSearch, "id" | "createdAt">;

/** A failed API call. `status` is 0 when the backend couldn't be reached at all. */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export async function searchFlights(departure: string, arrival: string, date: string): Promise<Flight[]> {
  const params = new URLSearchParams({ departure, arrival, date });
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/flights/search?${params.toString()}`);
  } catch {
    throw new ApiError("We couldn't reach the flight search service. Make sure the backend is running on port 8081.", 0);
  }
  if (!response.ok) {
    // The backend sends {"status": 400, "error": "..."}; fall back to a generic message if it doesn't.
    const body = await response.json().catch(() => null);
    const message = typeof body?.error === "string" ? body.error : `Flight search failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return response.json();
}

export async function listSearches(): Promise<SavedSearch[]> {
  const response = await fetch(`${API_BASE}/api/flight-searches`);
  if (!response.ok) throw new Error("Unable to load saved searches");
  const data = (await response.json()) as SavedSearch[];
  return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function saveSearch(search: NewSearch): Promise<SavedSearch> {
  const response = await fetch(`${API_BASE}/api/flight-searches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(search),
  });
  if (!response.ok) throw new Error("Search could not be saved");
  return response.json();
}

export async function deleteSearch(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/flight-searches/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Failed to delete search");
}

/** Builds the /results URL for a search so every entry point links the same way. */
export function resultsUrl(search: Pick<NewSearch, "homeAirport" | "destinations" | "departDate" | "returnDate" | "tripDuration" | "allowLayovers">) {
  return `/results?${new URLSearchParams({
    homeAirport: search.homeAirport,
    destinations: search.destinations,
    departDate: search.departDate,
    returnDate: search.returnDate ?? "",
    tripDuration: search.tripDuration ?? "",
    allowLayovers: String(search.allowLayovers),
  }).toString()}`;
}
