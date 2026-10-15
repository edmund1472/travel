"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HistoryIcon, PlaneIcon, SearchIcon } from "./icons";

const links = [
  { href: "/", label: "Search", icon: SearchIcon },
  { href: "/history", label: "History", icon: HistoryIcon },
];

export default function SiteHeader({ variant = "light" }: { variant?: "light" | "dark" }) {
  const pathname = usePathname();
  const dark = variant === "dark";

  return (
    <header className="relative z-30">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
            <PlaneIcon width={18} height={18} />
          </span>
          <span className={`text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
            Skyward
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            const tone = dark
              ? active
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
              : active
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900";
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${tone}`}
              >
                <Icon width={16} height={16} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
