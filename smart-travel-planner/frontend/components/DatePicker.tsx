"use client";

import { useCallback, useRef, useState } from "react";
import { formatShortDate, parseISODate, toISODate } from "@/lib/format";
import { useClickOutside } from "./useClickOutside";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, XIcon } from "./icons";

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Earliest selectable date (yyyy-mm-dd). Defaults to today. */
  min?: string;
  /** The other end of the trip, used to shade the range between the two dates. */
  rangeStart?: string;
  rangeEnd?: string;
  clearable?: boolean;
  compact?: boolean;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array(first).fill(null);
  for (let d = 1; d <= days; d += 1) cells.push(toISODate(new Date(year, month, d)));
  return cells;
}

export default function DatePicker({
  label,
  value,
  onChange,
  placeholder = "Add date",
  min,
  rangeStart,
  rangeEnd,
  clearable = false,
  compact = false,
}: DatePickerProps) {
  const today = toISODate(new Date());
  const minDate = min && min > today ? min : today;
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const [view, setView] = useState(() => {
    const base = parseISODate(value || minDate);
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const start = rangeStart ?? value;
  const end = rangeEnd ?? value;
  const canGoBack = view > parseISODate(today.slice(0, 8) + "01");

  const months = [0, 1].map((offset) => new Date(view.getFullYear(), view.getMonth() + offset, 1));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!open) {
            const base = parseISODate(value || minDate);
            setView(new Date(base.getFullYear(), base.getMonth(), 1));
            // Open toward whichever side has room for the two-month popover (38rem on md+).
            const rect = ref.current?.getBoundingClientRect();
            const popoverWidth = window.innerWidth >= 768 ? 608 : Math.min(window.innerWidth * 0.92, 320);
            setAlignRight(!!rect && rect.left + popoverWidth > window.innerWidth - 16);
          }
          setOpen((o) => !o);
        }}
        className={`group flex w-full flex-col rounded-2xl border bg-white text-left transition hover:border-slate-300 ${
          open ? "border-indigo-500 ring-4 ring-indigo-500/10" : "border-slate-200"
        } ${compact ? "px-3 py-2" : "px-4 py-3"}`}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="mt-1 flex min-h-7 items-center gap-2">
          <CalendarIcon width={18} height={18} className={open ? "text-indigo-500" : "text-slate-400"} />
          <span className={`flex-1 truncate text-base ${value ? "font-semibold text-slate-900" : "text-slate-400"}`}>
            {value ? formatShortDate(value) : placeholder}
          </span>
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              aria-label={`Clear ${label}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  onChange("");
                }
              }}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <XIcon width={14} height={14} />
            </span>
          )}
        </span>
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-2 w-[min(92vw,20rem)] rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/10 md:w-[38rem] ${
            alignRight ? "right-0" : "left-0"
          }`}
        >
          <div className="relative grid gap-6 md:grid-cols-2">
            <button
              type="button"
              disabled={!canGoBack}
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
              className="absolute left-0 top-0 rounded-full p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
              aria-label="Previous month"
            >
              <ChevronLeftIcon width={18} height={18} />
            </button>
            <button
              type="button"
              onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
              className="absolute right-0 top-0 rounded-full p-1.5 text-slate-600 hover:bg-slate-100"
              aria-label="Next month"
            >
              <ChevronRightIcon width={18} height={18} />
            </button>

            {months.map((month, i) => (
              <div key={month.toISOString()} className={i === 1 ? "hidden md:block" : ""}>
                <p className="mb-3 text-center text-sm font-semibold text-slate-900">
                  {month.toLocaleString("en-US", { month: "long", year: "numeric" })}
                </p>
                <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-slate-400">
                  {WEEKDAYS.map((d) => (
                    <div key={d} className="pb-2">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-1">
                  {monthGrid(month.getFullYear(), month.getMonth()).map((date, idx) => {
                    if (!date) return <div key={`blank-${idx}`} />;
                    const disabled = date < minDate;
                    const isEdge = date === start || date === end;
                    const inRange = start && end && date > start && date < end;
                    const isToday = date === today;
                    return (
                      <button
                        key={date}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onChange(date);
                          setOpen(false);
                        }}
                        className={`relative h-10 text-sm transition ${
                          inRange ? "bg-indigo-50 text-indigo-900" : ""
                        } ${
                          isEdge
                            ? "rounded-xl bg-indigo-600 font-semibold text-white shadow-md shadow-indigo-600/30"
                            : disabled
                              ? "cursor-not-allowed text-slate-300"
                              : "rounded-xl text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {Number(date.slice(8))}
                        {isToday && !isEdge && (
                          <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
