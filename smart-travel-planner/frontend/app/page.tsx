"use client";

import FlightSearchForm from "@/components/FlightSearchForm";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_40%),linear-gradient(135deg,_#f8fbff_0%,_#eef4ff_100%)] py-8 text-slate-800">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center justify-center flex-1">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Executive Travel Planning
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
              Flight Search Planner
            </h1>
          </div>
          <Link href="/history" className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 text-sm transition-colors">
            View History
          </Link>
        </div>

        <FlightSearchForm />
      </div>
    </main>
  );
}