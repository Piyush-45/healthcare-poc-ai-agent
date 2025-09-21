"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/patients", label: "Patients" },
  { href: "/calls", label: "Calls" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold">
                VA
              </div>
              <span className="font-semibold text-slate-800">VoiceAgent</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-1 rounded-md text-sm ${
                    pathname === n.href
                      ? "bg-slate-100 text-slate-900 font-medium"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Right-side actions (placeholder) */}
            <div className="hidden md:flex items-center gap-3">
              <button className="text-sm text-slate-600 hover:text-slate-900">Docs</button>
              <button className="text-sm text-slate-600 hover:text-slate-900">Support</button>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-slate-100"
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
            >
              <svg className="w-5 h-5 text-slate-700" viewBox="0 0 20 20" fill="currentColor">
                {open ? (
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path d="M3 6h14M3 10h14M3 14h14" strokeWidth={1.5} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu content */}
        {open && (
          <div className="md:hidden border-t pt-2 pb-4">
            <div className="flex flex-col gap-1">
              {navItems.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`px-3 py-2 rounded-md text-sm ${
                    pathname === n.href ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-700"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
