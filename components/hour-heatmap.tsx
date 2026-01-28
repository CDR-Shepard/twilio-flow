"use client";

import { useMemo } from "react";

export function HourHeatmap({
  data
}: {
  data: { hour: number; answered: number; missed: number; voicemail: number }[];
}) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.answered + d.missed + d.voicemail)), [data]);
  const rows = ["answered", "missed", "voicemail"] as const;
  const colors: Record<(typeof rows)[number], string> = {
    answered: "#2563eb",
    missed: "#f97316",
    voicemail: "#6366f1"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-500">
        <span>Hour of day</span>
        <span>Higher = more calls</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="px-2 py-2 text-left text-slate-500">Type</th>
              {Array.from({ length: 24 }).map((_, h) => (
                <th key={h} className="px-1 py-1 text-center text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row}>
                <td className="whitespace-nowrap px-2 py-2 font-medium text-slate-700 capitalize">{row}</td>
                {data.map((d) => {
                  const total = d.answered + d.missed + d.voicemail;
                  const value = d[row];
                  const intensity = total === 0 ? 0 : value / max;
                  const bg = value === 0 ? "#f8fafc" : hexWithAlpha(colors[row], Math.max(0.15, intensity * 0.9));
                  return (
                    <td key={`${row}-${d.hour}`} className="px-1 py-1 text-center">
                      <div
                        className="h-6 w-6 rounded"
                        style={{ background: bg }}
                        title={`${row}: ${value} @ ${d.hour}:00`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function hexWithAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}
