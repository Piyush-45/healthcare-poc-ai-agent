"use client";
import React from "react";

export default function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}
