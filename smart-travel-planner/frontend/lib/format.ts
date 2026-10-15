/** Parses a yyyy-mm-dd string as a local date (avoids the UTC off-by-one of `new Date("yyyy-mm-dd")`). */
export function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(value: string, days: number) {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }) {
  if (!value) return "—";
  return parseISODate(value).toLocaleDateString("en-US", opts);
}

export function formatShortDate(value: string | null | undefined) {
  return formatDate(value, { weekday: "short", month: "short", day: "numeric" });
}

/** SerpAPI times look like "2026-10-20 08:15". */
export function formatTime(value: string) {
  const time = value.split(" ")[1];
  if (!time) return value;
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Number of calendar days between departure and arrival timestamps (for "+1" badges). */
export function dayOffset(departure: string, arrival: string) {
  const d = departure.split(" ")[0];
  const a = arrival.split(" ")[0];
  if (!d || !a) return 0;
  return Math.round((parseISODate(a).getTime() - parseISODate(d).getTime()) / 86_400_000);
}

/** "5h 30m" -> 330 */
export function durationMinutes(value: string) {
  const hours = Number(value.match(/(\d+)h/)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)m/)?.[1] ?? 0);
  return hours * 60 + minutes;
}

export function formatPrice(value: number) {
  if (!value) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function stopsLabel(stops: number) {
  return stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? "s" : ""}`;
}

export function timeAgo(value: string) {
  const seconds = (Date.now() - new Date(value).getTime()) / 1000;
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
