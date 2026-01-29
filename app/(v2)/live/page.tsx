"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { SectionHeader } from "../../../components/magic/section-header";
import { LivePill } from "../../../components/magic/live-pill";
import { cn } from "../../../lib/utils";

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
  call_attempts?: { status?: string | null; agent_id?: string | null; started_at?: string | null; ended_at?: string | null }[];
};

const statusTone: Record<string, string> = {
  connected: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  ringing: "bg-amber-100 text-amber-800",
  initiated: "bg-slate-100 text-slate-700",
  failed: "bg-rose-100 text-rose-800"
};

export default function LivePage() {
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);

  const queryString = useMemo(() => {
    const q = new URLSearchParams();
    q.set("limit", "120");
    return q.toString();
  }, []);

  const fetchLatest = async () => {
    try {
      const res = await fetch(`/api/call-logs?${queryString}`);
      if (!res.ok) return;
      const json = await res.json();
      if (Array.isArray(json.calls)) setCalls(json.calls);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    const id = setInterval(fetchLatest, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const grouped = useMemo(() => groupByDay(calls), [calls]);

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Live feed"
        title="Recent calls"
        description="Timeline of inbound calls with recordings and voicemail playback."
        actions={<LivePill />}
      />

      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/60 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="tag">Timeline</span>
            <span className="text-slate-700">Last 120 calls</span>
          </div>
          <div className="text-xs text-slate-500">Auto-refreshing every 8s</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : (
          <div className="divide-y divide-white/60">
            {grouped.map((group) => (
              <div key={group.date} className="px-4 py-5">
                <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  <span className="h-px w-8 bg-slate-300/60" />
                  {group.dateLabel}
                </div>
                <div className="space-y-3">
                  {group.calls.map((call) => (
                    <div
                      key={call.id}
                      className="group rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm ring-1 ring-white/60 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/10"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs text-slate-500">{format(new Date(call.started_at), "PP p")}</span>
                        <span className={cn("rounded-full px-2 py-1 text-xs font-semibold capitalize", statusTone[call.status] ?? "bg-slate-100 text-slate-700")}>
                          {call.status}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          {call.tracked_numbers?.friendly_name ?? call.to_number ?? "Tracked number"}
                        </span>
                        <span className="text-xs text-slate-500">{call.agents?.full_name ?? "Unassigned"}</span>
                        {call.recording_url ? (
                          <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">Recording</span>
                        ) : null}
                        {call.voicemail_url ? (
                          <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">Voicemail</span>
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900">{call.from_number ?? "Unknown caller"}</p>
                          <p className="text-xs text-slate-500">to {call.to_number ?? "Unknown number"}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {call.recording_url ? (
                            <audio
                              className="max-w-[240px]"
                              controls
                              preload="none"
                              src={
                                call.recording_sid ? `/api/recordings/${call.recording_sid}` : `${call.recording_url}.mp3`
                              }
                            />
                          ) : null}
                          {call.voicemail_url ? (
                            <audio className="max-w-[240px]" controls preload="none" src={`${call.voicemail_url}.mp3`} />
                          ) : null}
                        </div>
                      </div>

                      {call.call_attempts && call.call_attempts.length > 0 ? (
                        <div className="mt-3 grid gap-2 md:grid-cols-2">
                          {call.call_attempts.map((a, idx) => (
                            <div key={idx} className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-xs text-slate-600">
                              <div className="flex justify-between">
                                <span className="font-semibold capitalize">{a.status ?? "attempt"}</span>
                                <span>{a.started_at ? format(new Date(a.started_at), "p") : "—"}</span>
                              </div>
                              <p>Agent: {a.agent_id ?? "unknown"}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {group.calls.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No calls for this day.</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function groupByDay(calls: CallRow[]) {
  const map = new Map<string, CallRow[]>();
  for (const call of calls) {
    const key = call.started_at.slice(0, 10);
    const arr = map.get(key) ?? [];
    arr.push(call);
    map.set(key, arr);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      dateLabel: format(new Date(date), "EEEE, MMM d"),
      calls: items
    }));
}
