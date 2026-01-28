"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type NumberPoint = { label: string; answered: number; missed: number; voicemail: number };

export function NumberBarChart({ data }: { data: NumberPoint[] }) {
  const top = data.slice(0, 8);
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" margin={{ left: 80, right: 16, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
          <YAxis dataKey="label" type="category" tick={{ fontSize: 12, fill: "#64748b" }} width={120} />
          <Tooltip contentStyle={{ borderRadius: 8, borderColor: "#e2e8f0" }} />
          <Legend verticalAlign="top" height={24} />
          <Bar dataKey="answered" name="Answered" stackId="a" fill="#2563eb" radius={[4, 4, 4, 4]} />
          <Bar dataKey="missed" name="Missed" stackId="a" fill="#f97316" radius={[4, 4, 4, 4]} />
          <Bar dataKey="voicemail" name="Voicemail" stackId="a" fill="#6366f1" radius={[4, 4, 4, 4]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
