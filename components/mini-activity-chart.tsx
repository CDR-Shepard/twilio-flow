"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";

type Point = { date: string; count: number };

export function MiniActivityChart({ points }: { points: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const chart = useMemo(() => build(points), [points]);
  const active = hover != null ? chart.points[hover] : null;

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox="0 0 700 220" className="w-full">
        <line x1="40" x2="660" y1="180" y2="180" stroke="#e5e7eb" strokeWidth="1" />
        <polyline
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          points={chart.poly}
          vectorEffect="non-scaling-stroke"
        />
        {chart.points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={5} fill="#2563eb" />
            <rect
              x={p.x - chart.step / 2}
              y={0}
              width={chart.step}
              height={220}
              fill="transparent"
              onMouseEnter={() => setHover(idx)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}
        {chart.labels.map((l, i) => (
          <text key={i} x={l.x} y={198} textAnchor="middle" fontSize="12" fill="#94a3b8">
            {l.label}
          </text>
        ))}
      </svg>
      {active ? (
        <div
          className="pointer-events-none absolute rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: Math.min(Math.max(active.x - 50, 8), 640), top: 16 }}
        >
          <div className="font-semibold text-slate-900">{format(new Date(active.date), "EEE, MMM d")}</div>
          <div className="text-slate-700">Calls: {active.count}</div>
        </div>
      ) : null}
    </div>
  );
}

type MiniChartData = {
  poly: string;
  labels: { x: number; label: string }[];
  points: { x: number; y: number; date: string; count: number }[];
  step: number;
};

function build(points: Point[]): MiniChartData {
  if (!points.length) return { poly: "", labels: [], points: [], step: 90 };
  const xMin = 40;
  const xMax = 660;
  const step = (xMax - xMin) / Math.max(points.length - 1, 1);
  const yBase = 180;
  const yMaxLift = 120;
  const max = Math.max(1, ...points.map((p) => p.count));
  const pts = points.map((p, i) => {
    const x = xMin + step * i;
    const y = yBase - (p.count / max) * yMaxLift;
    return { x, y, date: p.date, count: p.count };
  });
  const poly = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const labels = pts.map((p) => ({ x: p.x, label: format(new Date(p.date), "MMM d") }));
  return { poly, labels, points: pts, step };
}
