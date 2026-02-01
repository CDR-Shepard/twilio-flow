"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type NumberPoint = { label: string; answered: number; missed: number; voicemail: number };

export function NumberBarChart({ data }: { data: NumberPoint[] }) {
  const top = data.slice(0, 8);
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={top} layout="vertical" barSize={16} margin={{ left: 80, right: 12, top: 6, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" strokeOpacity={0.7} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} allowDecimals={false} axisLine={false} tickLine={false} />
          <YAxis dataKey="label" type="category" tick={{ fontSize: 12, fill: "#475569" }} width={130} axisLine={false} tickLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(15,23,42,0.04)" }}
            contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}
          />
          <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: 12, color: "#475569" }} />
          <Bar dataKey="answered" name="Answered" stackId="a" fill="#0f172a" radius={[8, 8, 8, 8]} />
          <Bar dataKey="missed" name="Missed" stackId="a" fill="#9ca3af" radius={[8, 8, 8, 8]} />
          <Bar dataKey="voicemail" name="Voicemail" stackId="a" fill="#cbd5e1" radius={[8, 8, 8, 8]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
