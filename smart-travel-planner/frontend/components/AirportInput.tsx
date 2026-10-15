"use client";

import { useCallback, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cityFor, findAirport, searchAirports, type Airport } from "@/lib/airports";
import { useClickOutside } from "./useClickOutside";
import { XIcon } from "./icons";

interface AirportInputProps {
  label: string;
  icon: ReactNode;
  placeholder: string;
  /** Selected IATA codes. Single-select fields hold at most one. */
  value: string[];
  onChange: (codes: string[]) => void;
  multiple?: boolean;
  exclude?: string[];
  compact?: boolean;
}

export default function AirportInput({
  label,
  icon,
  placeholder,
  value,
  onChange,
  multiple = false,
  exclude = [],
  compact = false,
}: AirportInputProps) {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(wrapperRef, close, open);

  const options = useMemo(() => {
    const matches: Array<Airport & { custom?: boolean }> = searchAirports(query, [...value, ...exclude]);
    const code = query.trim().toUpperCase();
    // Let people type any IATA code, not just the ones in our list.
    if (matches.length === 0 && /^[A-Z]{3}$/.test(code) && !findAirport(code) && !value.includes(code)) {
      matches.push({ code, city: code, name: "Use this airport code", country: "", custom: true });
    }
    return matches;
  }, [query, value, exclude]);

  const select = (code: string) => {
    onChange(multiple ? [...value, code] : [code]);
    setQuery("");
    setHighlight(0);
    if (multiple) {
      inputRef.current?.focus();
    } else {
      setOpen(false);
    }
  };

  const remove = (code: string) => onChange(value.filter((c) => c !== code));

  const showSelectedAsText = !multiple && value.length === 1 && !open;

  return (
    <div ref={wrapperRef} className="relative">
      <label
        htmlFor={id}
        className={`group flex h-full cursor-text flex-col rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 ${
          compact ? "px-3 py-2" : "px-4 py-3"
        }`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="mt-1 flex min-h-7 flex-wrap items-center gap-1.5">
          <span className="text-slate-400 group-focus-within:text-indigo-500">{icon}</span>

          {multiple &&
            value.map((code) => (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 py-0.5 pl-2 pr-1 text-sm font-semibold text-indigo-700"
              >
                {code}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    remove(code);
                  }}
                  className="rounded p-0.5 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
                  aria-label={`Remove ${code}`}
                >
                  <XIcon width={12} height={12} />
                </button>
              </span>
            ))}

          {showSelectedAsText ? (
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                requestAnimationFrame(() => inputRef.current?.focus());
              }}
              className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
            >
              <span className="text-base font-semibold text-slate-900">{value[0]}</span>
              <span className="truncate text-sm text-slate-500">{cityFor(value[0])}</span>
            </button>
          ) : (
            <input
              ref={inputRef}
              id={id}
              type="text"
              autoComplete="off"
              role="combobox"
              aria-expanded={open && options.length > 0}
              aria-controls={`${id}-list`}
              placeholder={multiple && value.length > 0 ? "Add another" : placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlight(0);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHighlight((h) => Math.min(h + 1, options.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHighlight((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter" && open && options[highlight]) {
                  e.preventDefault();
                  select(options[highlight].code);
                } else if (e.key === "Backspace" && !query && multiple && value.length) {
                  remove(value[value.length - 1]);
                }
              }}
              className="min-w-[6rem] flex-1 bg-transparent text-base font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
            />
          )}
        </span>
      </label>

      {open && options.length > 0 && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-2 max-h-80 w-full min-w-[18rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-900/10"
        >
          {options.map((airport, index) => (
            <li key={airport.code} role="option" aria-selected={index === highlight}>
              <button
                type="button"
                onMouseEnter={() => setHighlight(index)}
                onClick={() => select(airport.code)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                  index === highlight ? "bg-indigo-50" : ""
                }`}
              >
                <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                  {airport.code}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-slate-900">
                    {airport.custom ? airport.code : `${airport.city}, ${airport.country}`}
                  </span>
                  <span className="block truncate text-xs text-slate-500">{airport.name}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
