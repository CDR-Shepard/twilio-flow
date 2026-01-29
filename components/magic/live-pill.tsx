"use client";

export function LivePill({ label = "Live" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
      {label}
    </span>
  );
}
