"use client";

import FlightSearchForm, { type SearchValues } from "./FlightSearchForm";

/** Slim, single-row search bar used on the results page, pre-filled with the current search. */
export default function CompactFlightSearch({ initial }: { initial?: Partial<SearchValues> }) {
  return <FlightSearchForm variant="compact" initial={initial} />;
}
