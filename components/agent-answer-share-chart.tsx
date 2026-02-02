"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

type TrackingNumber = { id: string; label: string };

const palette = ["#0ea5e9", "#8b5cf6", "#f97316", "#22c55e", "#f43f5e", "#14b8a6", "#eab308", "#6366f1"];

export function AgentAnswerShareChart({ trackingNumbers }: { trackingNumbers: TrackingNumber[] }) {
  const [range, setRange] = useState<"1h" | "24h" | "7d" | "30d">("7d");
  const [trackingNumberId, setTrackingNumberId] = useState<string>("all");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const url = `/api/analytics/agent-share?range=${range}${
        trackingNumberId !== "all" ? `&tracking_number_id=${trackingNumberId}` : ""
      }`;
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (!cancelled) setData(json);
    };
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [range, trackingNumberId]);

  const chartData = useMemo(() => {
    if (!data?.data) return [];
    const buckets: Record<string, Record<string, number>> = {};
    const labels: Record<string, string> = {};
    const agentsMap: Record<string, string> = data.agents || {};

    data.data.forEach((row: { bucket_start: string; agent_id: string; pct: number }) => {
      const key = row.bucket_start;
      if (!buckets[key]) buckets[key] = {};
      buckets[key][row.agent_id] = Math.round((row.pct ?? 0) * 1000) / 10;
      labels[key] = format(parseISO(key), data.bucket === "minute" ? "h:mm a" : data.bucket === "hour" ? "MMM d h a" : "MMM d");
    });

    return Object.entries(buckets)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([bucketStart, values]) => ({
        bucketStart,
        label: labels[bucketStart],
        ...values,
        total: Object.values(values).reduce((a, b) => a + b, 0)
      }));
  }, [data]);

  const agentIds = useMemo(() => {
    const ids = new Set<string>();
    chartData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (["bucketStart", "label", "total"].includes(k)) return;
        ids.add(k);
      });
    });
    return Array.from(ids);
  }, [chartData]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
            value={trackingNumberId}
            onChange={(e) => setTrackingNumberId(e.target.value)}
          >
            <option value="all">All campaigns</option>
            {trackingNumbers.map((tn) => (
              <option key={tn.id} value={tn.id}>
                {tn.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {(["1h", "24h", "7d", "30d"] as const).map((r) => (
            <Button
              key={r}
              size="sm"
              variant={range === r ? "accent" : "ghost"}
              onClick={() => setRange(r)}
              className={cn("px-3", range === r ? "" : "text-slate-600")}
            >
              {r === "1h" ? "Last hour" : r === "24h" ? "Last day" : r === "7d" ? "Last 7d" : "Last 30d"}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} stackOffset="expand" margin={{ top: 10, right: 18, left: -6, bottom: 6 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" strokeOpacity={0.7} />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `${Math.round(v * 100)}%`} />
            <Tooltip
              contentStyle={{ borderRadius: 10, borderColor: "#e2e8f0", boxShadow: "0 10px 30px rgba(15,23,42,0.08)" }}
              formatter={(value: number, key: string) => [`${Math.round((value ?? 0) * 100)}%`, data?.agents?.[key]?.full_name ?? key]}
            />
            <Legend verticalAlign="top" height={26} iconType="circle" wrapperStyle={{ fontSize: 12, color: "#334155" }} />
            {agentIds.map((id, idx) => (
              <Area
                key={id}
                type="monotone"
                dataKey={id}
                name={data?.agents?.[id]?.full_name ?? "Agent"}
                stackId="1"
                stroke={palette[idx % palette.length]}
                fill={palette[idx % palette.length]}
                strokeWidth={2}
                fillOpacity={0.65}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
