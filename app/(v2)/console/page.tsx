import { requireAdminSession } from "../../../lib/auth";
import { loadMetrics } from "../../../lib/metrics";
import { LivePill } from "../../../components/magic/live-pill";
import { BentoCard, BentoGrid } from "../../../components/magic/bento-grid";
import { TrendChart } from "../../../components/trend-chart";
import { NumberBarChart } from "../../../components/number-bar-chart";
import { HourHeatmap } from "../../../components/hour-heatmap";
import { PhoneCall, Voicemail, Clock4, Phone, Users, Activity } from "lucide-react";
import { cn } from "../../../lib/utils";

function formatSeconds(value: number | null) {
  if (value == null) return "—";
  if (value < 60) return `${value}s`;
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}m ${secs}s`;
}

export default async function ConsolePage() {
  const { supabase } = await requireAdminSession();
  const metrics = await loadMetrics(supabase, {});
  const topAgents = metrics.agents.sort((a, b) => b.answered - a.answered).slice(0, 5);
  const topNumbers = metrics.numbers.sort((a, b) => b.answered - a.answered).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/85 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.14)] ring-1 ring-white/60 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_70%_0%,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_35%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700/80">Command Center</p>
            <h1 className="text-3xl font-bold text-slate-900">Voice Operations</h1>
            <p className="text-sm text-slate-600">Realtime pulse across calls, agents, and tracked numbers.</p>
          </div>
          <div className="flex items-center gap-3">
            <LivePill label="Live data" />
            <a
              href="/live"
              className="glass-pill rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20"
            >
              Go to live feed
            </a>
          </div>
        </div>
      </div>

      <BentoGrid>
        <BentoCard title="Answer velocity" description="Speed to pick up" icon={<Clock4 className="h-5 w-5" />} className="md:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Avg answer" value={formatSeconds(metrics.summary.avg_answer_sec)} accent="text-indigo-700" />
            <Kpi label="Avg handle" value={formatSeconds(metrics.summary.avg_handle_sec)} accent="text-slate-800" />
          </div>
        </BentoCard>

        <BentoCard title="Answer mix" description="Today" icon={<PhoneCall className="h-5 w-5" />} className="md:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Answered" value={metrics.summary.answered} accent="text-emerald-700" />
            <Kpi label="Missed" value={metrics.summary.missed} accent="text-amber-700" />
            <Kpi label="Abandoned" value={metrics.summary.abandoned} accent="text-rose-700" />
          </div>
        </BentoCard>

        <BentoCard title="Voicemail" description="Completed to VM" icon={<Voicemail className="h-5 w-5" />} className="md:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Voicemails" value={metrics.summary.voicemail} accent="text-slate-800" />
            <Kpi
              label="Voicemail %"
              value={`${metrics.summary.total ? Math.round((metrics.summary.voicemail / metrics.summary.total) * 100) : 0}%`}
              accent="text-slate-700"
            />
          </div>
        </BentoCard>
      </BentoGrid>

      <BentoGrid className="md:grid-cols-12">
        <BentoCard
          title="Trend"
          description="Answered vs missed vs voicemail"
          icon={<Activity className="h-5 w-5" />}
          className="md:col-span-7"
          subtle
        >
          <div className="surface mt-3 p-2">
            <TrendChart data={metrics.trends} />
          </div>
        </BentoCard>

        <BentoCard
          title="Hourly load"
          description="Answered vs missed vs voicemail by hour"
          icon={<Clock4 className="h-5 w-5" />}
          className="md:col-span-5"
          subtle
        >
          <div className="surface mt-3 p-2">
            <HourHeatmap data={metrics.hours} />
          </div>
        </BentoCard>

        <BentoCard
          title="Top numbers"
          description="Most answered tracked numbers"
          icon={<Phone className="h-5 w-5" />}
          className="md:col-span-5"
          subtle
        >
          <div className="surface mt-3 p-2">
            <NumberBarChart data={topNumbers} />
          </div>
        </BentoCard>

        <BentoCard
          title="Agent leaderboard"
          description="Answered calls and answer time"
          icon={<Users className="h-5 w-5" />}
          className="md:col-span-7"
          subtle
        >
          <div className="surface mt-3 overflow-hidden p-2">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Agent</th>
                    <th className="px-3 py-2">Answered</th>
                    <th className="px-3 py-2">Avg answer</th>
                  </tr>
                </thead>
                <tbody>
                  {topAgents.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">{a.name}</td>
                      <td className="px-3 py-2">{a.answered}</td>
                      <td className="px-3 py-2">{formatSeconds(a.avg_answer_sec)}</td>
                    </tr>
                  ))}
                  {topAgents.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-500">
                        No agent activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-3 shadow-md ring-1 ring-white/60 backdrop-blur-xl transition-transform duration-150 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      </div>
      <p className={cn("text-2xl font-bold text-slate-900", accent)}>{value}</p>
    </div>
  );
}
