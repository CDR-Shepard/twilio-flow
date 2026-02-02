"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";

type TrendPoint = { date: string; answered: number; missed: number; voicemail: number };

type Props = { data: TrendPoint[] };

export function TrendChart({ data }: Props) {
  const colors = {
    answered: "#0ea5e9", // cyan-500
    missed: "#f97316", // orange-500
    voicemail: "#8b5cf6" // violet-500
  };

  const formatted = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), "MMM d")
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 18, left: -10, bottom: 6 }}>
          <defs>
            <linearGradient id="answered" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.answered} stopOpacity={0.35} />
              <stop offset="95%" stopColor={colors.answered} stopOpacity={0.08} />
            </linearGradient>
            <linearGradient id="missed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.missed} stopOpacity={0.32} />
              <stop offset="95%" stopColor={colors.missed} stopOpacity={0.07} />
            </linearGradient>
            <linearGradient id="voicemail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors.voicemail} stopOpacity={0.3} />
              <stop offset="95%" stopColor={colors.voicemail} stopOpacity={0.07} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.7} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} width={42} allowDecimals={false} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}
          />
          <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: 12, color: "#334155" }} />
          <Area type="monotone" dataKey="answered" name="Answered" stroke={colors.answered} fill="url(#answered)" strokeWidth={2.4} />
          <Area type="monotone" dataKey="missed" name="Missed" stroke={colors.missed} fill="url(#missed)" strokeWidth={2.2} />
          <Area type="monotone" dataKey="voicemail" name="Voicemail" stroke={colors.voicemail} fill="url(#voicemail)" strokeWidth={2.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
