"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "../../../lib/utils";
import { Activity, ArrowUpRight, PhoneCall, Voicemail } from "lucide-react";

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      setLastUpdated(new Date());
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
  const summary = useMemo(() => {
    const recordings = calls.filter((c) => !!c.recording_url).length;
    const voicemails = calls.filter((c) => !!c.voicemail_url).length;
    return { total: calls.length, recordings, voicemails };
  }, [calls]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Live feed</p>
          <h1 className="text-3xl font-semibold text-slate-900">Recent calls</h1>
          <p className="text-sm text-slate-600">Timeline of inbound calls with recordings and voicemail playback.</p>
        </div>
        <Link
          href="/console"
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Console
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Auto-refresh</p>
              <p className="text-sm font-semibold text-slate-800">Every 8 seconds</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
              Live
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Calls" value={summary.total} icon={<PhoneCall className="h-4 w-4" />} />
            <Stat label="Recordings" value={summary.recordings} icon={<Activity className="h-4 w-4" />} />
            <Stat label="Voicemail" value={summary.voicemails} icon={<Voicemail className="h-4 w-4" />} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Last 120 records. {lastUpdated ? `Updated ${format(lastUpdated, "PP p")}` : "Awaiting first sync…"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 text-sm text-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Timeline</span>
              <span className="text-slate-800">Last 120 calls</span>
            </div>
            <div className="text-xs text-slate-500">Tap a row to play audio</div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Loading…</div>
          ) : (
            <div className="divide-y divide-slate-100">
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
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Recording</span>
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
                              <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
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

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-slate-500">
        <span>{label}</span>
        {icon}
      </div>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
