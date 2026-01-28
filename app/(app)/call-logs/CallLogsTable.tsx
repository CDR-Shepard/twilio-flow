"use client";

import { useEffect, useMemo, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { format } from "date-fns";

const statusStyle: Record<string, string> = {
  initiated: "bg-slate-100 text-slate-700",
  ringing: "bg-amber-100 text-amber-800",
  connected: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800"
};

type CallRow = {
  id: string;
  from_number: string | null;
  to_number: string | null;
  status: string;
  started_at: string;
  ended_at: string | null;
  agents?: { full_name?: string | null } | null;
  tracked_numbers?: { friendly_name?: string | null } | null;
  voicemail_url?: string | null;
  recording_url?: string | null;
  recording_sid?: string | null;
  recording_duration_seconds?: number | null;
};

type CallDetail = CallRow & {
  call_attempts?: { status?: string | null; agent_id?: string | null; started_at?: string | null; ended_at?: string | null }[];
};

export function CallLogsTable({
  initialCalls,
  searchParams
}: {
  initialCalls: CallRow[];
  searchParams: { tracked_number_id?: string; status?: string; agent_id?: string; q?: string; from?: string; to?: string };
}) {
  const queryString = useMemo(() => {
    const query = new URLSearchParams();
    if (searchParams.tracked_number_id) query.set("tracked_number_id", searchParams.tracked_number_id);
    if (searchParams.status) query.set("status", searchParams.status);
    if (searchParams.agent_id) query.set("agent_id", searchParams.agent_id);
    if (searchParams.q) query.set("q", searchParams.q);
    if (searchParams.from) query.set("from", searchParams.from);
    if (searchParams.to) query.set("to", searchParams.to);
    query.set("limit", "100");
    return query.toString();
  }, [searchParams.tracked_number_id, searchParams.status, searchParams.agent_id, searchParams.q, searchParams.from, searchParams.to]);

  const [calls, setCalls] = useState<CallRow[]>(initialCalls);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CallDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/call-logs?${queryString}`);
        if (!res.ok) return;
        const json = await res.json();
        if (Array.isArray(json.calls)) {
          setCalls(json.calls);
          setLastUpdated(new Date());
        }
      } catch (e) {
        // ignore transient errors
      }
    };

    fetchLatest();
    const id = setInterval(fetchLatest, 10000);
    return () => clearInterval(id);
  }, [queryString]);

  // Supabase realtime to reduce perceived lag
  useEffect(() => {
    const channel = supabase
      .channel("calls-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "calls" },
        () => {
          // debounce by waiting a tick
          setTimeout(() => {
            fetch(`/api/call-logs?${queryString}`)
              .then((res) => res.json())
              .then((json) => {
                if (Array.isArray(json.calls)) {
                  setCalls(json.calls);
                  setLastUpdated(new Date());
                }
              })
              .catch(() => {});
          }, 200);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryString]);

  const chart = useMemo(() => buildChartPoints(calls), [calls]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/calls/${id}`);
      if (res.ok) {
        const json = await res.json();
        setSelected(json.call as CallDetail);
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity</h1>
          <p className="text-sm text-slate-600">Live-ish feed; auto-refreshes every 10s.</p>
        </div>
        <div className="text-xs text-slate-500">Updated {format(lastUpdated, "PPpp")}</div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last 7 days</p>
            <p className="text-lg font-semibold text-slate-900">{chart.total} calls</p>
          </div>
          <div className="text-xs text-slate-500">Max {chart.max} / day</div>
        </div>
        <div className="w-full overflow-hidden">
          <svg viewBox="0 0 700 220" role="img" aria-label="Calls in last 7 days" className="w-full">
            <line x1="40" x2="660" y1="180" y2="180" stroke="#e5e7eb" strokeWidth="1" />
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="3"
              points={chart.points}
              vectorEffect="non-scaling-stroke"
            />
            {chart.circles.map((c, i) => (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r={5} fill="#2563eb" />
              </g>
            ))}
            {chart.labels.map((l, i) => (
              <text key={i} x={l.x} y={198} textAnchor="middle" fontSize="12" fill="#94a3b8">
                {l.label}
              </text>
            ))}
          </svg>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Started</th>
                <th className="px-3 py-2">Caller</th>
                <th className="px-3 py-2">Tracked number</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Answered by</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Recording</th>
                <th className="px-3 py-2">Voicemail</th>
              </tr>
            </thead>
            <tbody>
              {calls?.map((call) => (
                <tr
                  key={call.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => openDetail(call.id)}
                >
                  <td className="px-3 py-2 whitespace-nowrap">{format(new Date(call.started_at), "PP p")}</td>
                  <td className="px-3 py-2 font-mono text-xs">{call.from_number ?? "Unknown"}</td>
                  <td className="px-3 py-2">{call.tracked_numbers?.friendly_name ?? call.to_number ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${
                        statusStyle[call.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{call.agents?.full_name ?? "—"}</td>
                  <td className="px-3 py-2">
                    {call.ended_at
                      ? Math.round(
                          (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000
                        ) + "s"
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {call.recording_url ? (
                      <div className="space-y-1">
                        <audio
                          className="max-w-[220px]"
                          controls
                          preload="none"
                          src={
                            call.recording_sid
                              ? `/api/recordings/${call.recording_sid}`
                              : `${call.recording_url}.mp3`
                          }
                        />
                        {call.recording_duration_seconds ? (
                          <p className="text-xs text-slate-500">
                            {Math.round(call.recording_duration_seconds)}s
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {call.voicemail_url ? (
                      <audio className="max-w-[220px]" controls preload="none" src={`${call.voicemail_url}.mp3`} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {(!calls || calls.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-500">
                    No calls yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId ? (
        <div className="fixed inset-0 z-30 flex items-start justify-end bg-black/30 backdrop-blur-sm">
          <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Call detail</p>
                <p className="text-sm font-semibold text-slate-900">{selected?.from_number ?? "Unknown caller"}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setSelected(null);
                }}
                className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-4">
              {loadingDetail && <p className="text-sm text-slate-500">Loading…</p>}
              {selected && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Started</p>
                      <p className="font-medium">{format(new Date(selected.started_at), "PP p")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="font-medium capitalize">{selected.status}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tracked number</p>
                      <p className="font-medium">{selected.tracked_numbers?.friendly_name ?? selected.to_number ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Answered by</p>
                      <p className="font-medium">{selected.agents?.full_name ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="font-medium">
                        {selected.ended_at
                          ? Math.round(
                              (new Date(selected.ended_at).getTime() - new Date(selected.started_at).getTime()) / 1000
                            ) + "s"
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Audio</p>
                    {selected.recording_url ? (
                      <audio
                        className="w-full"
                        controls
                        preload="none"
                        src={
                          selected.recording_sid
                            ? `/api/recordings/${selected.recording_sid}`
                            : `${selected.recording_url}.mp3`
                        }
                      />
                    ) : (
                      <p className="text-sm text-slate-500">No recording</p>
                    )}
                    {selected.voicemail_url ? (
                      <audio className="w-full" controls preload="none" src={`${selected.voicemail_url}.mp3`} />
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-[0.15em] text-slate-500 mb-1">Attempts</p>
                    <div className="space-y-2 text-sm">
                      {(selected.call_attempts ?? []).map((a, idx) => (
                        <div key={idx} className="rounded-md border border-slate-200 px-3 py-2">
                          <div className="flex justify-between">
                            <span className="font-medium capitalize">{a.status ?? "initiated"}</span>
                            <span className="text-xs text-slate-500">
                              {a.started_at ? format(new Date(a.started_at), "PP p") : "—"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">Agent: {a.agent_id ?? "unknown"}</p>
                        </div>
                      ))}
                      {(selected.call_attempts ?? []).length === 0 && (
                        <p className="text-sm text-slate-500">No leg events captured.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildChartPoints(calls: CallRow[]) {
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const counts = days.map((d) => {
    const dateStr = d.toISOString().slice(0, 10);
    return calls.filter((c) => c.started_at.slice(0, 10) === dateStr).length;
  });
  const max = Math.max(1, ...counts);
  const xMin = 40;
  const xMax = 660;
  const yBase = 180;
  const yMaxLift = 120;
  const pointsArr = counts.map((c, i) => {
    const x = xMin + ((xMax - xMin) * i) / 6;
    const y = yBase - (c / max) * yMaxLift;
    return { x, y };
  });
  const points = pointsArr.map((p) => `${p.x},${p.y}`).join(" ");
  const circles = pointsArr;
  const labels = days.map((d, i) => ({
    x: xMin + ((xMax - xMin) * i) / 6,
    label: format(d, "MMM d")
  }));
  const total = counts.reduce((a, b) => a + b, 0);
  return { points, circles, labels, max: Math.max(...counts), total };
}
