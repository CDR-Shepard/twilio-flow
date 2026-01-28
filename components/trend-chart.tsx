"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Brush } from "recharts";
import { format, parseISO } from "date-fns";

type TrendPoint = { date: string; answered: number; missed: number; voicemail: number };

type Props = { data: TrendPoint[] };

export function TrendChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d")
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 16, right: 24, left: 0, bottom: 32 }}>
          <defs>
            <linearGradient id="answered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="missed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="voicemail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 12, fill: "#64748b" }} width={50} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }} />
          <Legend verticalAlign="top" height={24} />
          <Area type="monotone" dataKey="answered" name="Answered" stroke="#2563eb" fill="url(#answered)" strokeWidth={2} />
          <Area type="monotone" dataKey="missed" name="Missed" stroke="#f97316" fill="url(#missed)" strokeWidth={2} />
          <Area type="monotone" dataKey="voicemail" name="Voicemail" stroke="#6366f1" fill="url(#voicemail)" strokeWidth={2} />
          <Brush dataKey="label" height={24} stroke="#94a3b8" travellerWidth={10} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
