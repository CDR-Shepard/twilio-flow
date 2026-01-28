"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";

type Point = { date: string; answered: number; missed: number };

export function TrendChart({ trends }: { trends: Point[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const chart = useMemo(() => buildTrendPoints(trends), [trends]);
  const active = hoverIndex != null ? chart.points[hoverIndex] : null;

  return (
    <div className="relative w-full overflow-hidden">
      <svg viewBox="0 0 720 260" className="w-full">
        <line x1="50" x2="690" y1="210" y2="210" stroke="#e5e7eb" strokeWidth="1" />
        <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={chart.answered} vectorEffect="non-scaling-stroke" />
        <polyline fill="none" stroke="#f97316" strokeWidth="3" points={chart.missed} vectorEffect="non-scaling-stroke" />
        {chart.points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.yAnswered} r={4} fill="#2563eb" />
            <circle cx={p.x} cy={p.yMissed} r={4} fill="#f97316" />
            <rect
              x={p.x - chart.step / 2}
              y={0}
              width={chart.step}
              height={260}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          </g>
        ))}
        {chart.labels.map((l, i) => (
          <text key={i} x={l.x} y={228} textAnchor="middle" fontSize="12" fill="#94a3b8">
            {l.label}
          </text>
        ))}
      </svg>
      {active ? (
        <div
          className="pointer-events-none absolute rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{
            left: Math.min(Math.max(active.x - 50, 8), 640),
            top: 24
          }}
        >
          <div className="font-semibold text-slate-900">{format(parseISO(active.date), "EEE, MMM d")}</div>
          <div className="mt-1 space-y-1 text-slate-700">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-600" />Answered: {active.answered}</div>
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-orange-500" />Missed: {active.missed}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type TrendChartData = {
  answered: string;
  missed: string;
  labels: { x: number; label: string }[];
  points: { x: number; yAnswered: number; yMissed: number; answered: number; missed: number; date: string }[];
  step: number;
};

function buildTrendPoints(trends: Point[]): TrendChartData {
  if (!trends.length)
    return { answered: "", missed: "", labels: [], points: [], step: 90 };
  const dates = trends.map((t) => t.date).sort();
  const step = 640 / Math.max(dates.length - 1, 1);
  const xMin = 50;
  const yBase = 200;
  const yMaxLift = 130;
  const max = Math.max(1, ...trends.map((t) => t.answered), ...trends.map((t) => t.missed));
  const labels = dates.map((d, i) => ({
    x: xMin + step * i,
    label: format(parseISO(d), "MMM d")
  }));
  const pointsData = dates.map((d, i) => {
    const t = trends.find((x) => x.date === d)!;
    const x = xMin + step * i;
    const yAnswered = yBase - (t.answered / max) * yMaxLift;
    const yMissed = yBase - (t.missed / max) * yMaxLift;
    return { x, yAnswered, yMissed, answered: t.answered, missed: t.missed, date: t.date };
  });
  const answered = pointsData.map((p) => `${p.x},${p.yAnswered}`).join(" ");
  const missed = pointsData.map((p) => `${p.x},${p.yMissed}`).join(" ");
  return { answered, missed, labels, points: pointsData, step };
}
