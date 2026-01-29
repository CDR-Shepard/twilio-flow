import { requireAdminSession } from "../../../lib/auth";
import { loadMetrics } from "../../../lib/metrics";
import { LivePill } from "../../../components/magic/live-pill";
import { BentoCard, BentoGrid } from "../../../components/magic/bento-grid";
import { TrendChart } from "../../../components/trend-chart";
import { NumberBarChart } from "../../../components/number-bar-chart";
import { HourHeatmap } from "../../../components/hour-heatmap";
import { PhoneCall, Voicemail, Clock4, Phone, Users, Flame, ShieldCheck, AlertTriangle } from "lucide-react";
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
  const answeredPct = metrics.summary.total ? Math.round((metrics.summary.answered / metrics.summary.total) * 100) : 0;
  const missedPct = metrics.summary.total ? Math.round((metrics.summary.missed / metrics.summary.total) * 100) : 0;
  const abandonPct = metrics.summary.total ? Math.round((metrics.summary.abandoned / metrics.summary.total) * 100) : 0;
  const voicemailPct = metrics.summary.total ? Math.round((metrics.summary.voicemail / metrics.summary.total) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.14)] ring-1 ring-white/60 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_70%_0%,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.12),transparent_35%)]" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700/80">Sales Ops Cockpit</p>
            <h1 className="text-3xl font-bold text-slate-900">Realtime Routing Health</h1>
            <p className="text-sm text-slate-600">Answer performance, missed risk, and agent responsiveness in one place.</p>
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
        <BentoCard title="Answer velocity" description="Speed to connect and handle" icon={<Clock4 className="h-5 w-5" />} className="md:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Avg answer" value={formatSeconds(metrics.summary.avg_answer_sec)} accent="text-indigo-700" />
            <Kpi label="Avg handle" value={formatSeconds(metrics.summary.avg_handle_sec)} accent="text-slate-800" />
          </div>
        </BentoCard>

        <BentoCard title="Answer rate" description="Hit target: 90%+" icon={<PhoneCall className="h-5 w-5" />} className="md:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Answered" value={`${answeredPct}%`} accent="text-emerald-700" />
            <Kpi label="Missed" value={`${missedPct}%`} accent="text-amber-700" />
            <Kpi label="Abandoned" value={`${abandonPct}%`} accent="text-rose-700" />
          </div>
        </BentoCard>

        <BentoCard title="Voicemail load" description="Share going to voicemail" icon={<Voicemail className="h-5 w-5" />} className="md:col-span-2">
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Voicemails" value={metrics.summary.voicemail} accent="text-slate-800" />
            <Kpi label="Voicemail %" value={`${voicemailPct}%`} accent="text-slate-700" />
          </div>
        </BentoCard>
      </BentoGrid>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="surface p-4">
            <div className="flex items-center gap-2 pb-3">
              <span className="tag">Trend</span>
              <p className="text-sm font-semibold text-slate-700">Answered vs missed vs voicemail</p>
            </div>
            <TrendChart data={metrics.trends} />
          </div>

          <div className="surface p-4">
            <div className="flex items-center gap-2 pb-3">
              <span className="tag">Hourly load</span>
              <p className="text-sm font-semibold text-slate-700">Answered vs missed vs voicemail by hour</p>
            </div>
            <HourHeatmap data={metrics.hours} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface p-4">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-rose-600" />
                <p className="text-sm font-semibold text-slate-800">Watch list</p>
              </div>
              <span className="rounded-full bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700">Auto rules</span>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              {missedPct > 10 ? (
                <AlertRow
                  icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
                  title="High miss rate"
                  detail={`Missed at ${missedPct}% over last window.`}
                />
              ) : null}
              {metrics.summary.avg_answer_sec != null && metrics.summary.avg_answer_sec > 30 ? (
                <AlertRow
                  icon={<Clock4 className="h-4 w-4 text-amber-600" />}
                  title="Slow answer speed"
                  detail={`Avg answer ${formatSeconds(metrics.summary.avg_answer_sec)}.`}
                />
              ) : null}
              {voicemailPct > 15 ? (
                <AlertRow
                  icon={<Voicemail className="h-4 w-4 text-indigo-600" />}
                  title="Voicemail rising"
                  detail={`Voicemail share ${voicemailPct}%.`}
                />
              ) : null}
              {missedPct <= 10 && voicemailPct <= 15 && (metrics.summary.avg_answer_sec ?? 0) <= 30 ? (
                <AlertRow
                  icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
                  title="No issues"
                  detail="All routing signals healthy."
                />
              ) : null}
            </div>
          </div>

          <div className="surface p-4">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-600" />
                <p className="text-sm font-semibold text-slate-800">Top numbers</p>
              </div>
              <a href="/tracked-numbers" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                View all
              </a>
            </div>
            <NumberBarChart data={topNumbers} />
          </div>

          <div className="surface p-4">
            <div className="flex items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold text-slate-800">Agent leaderboard</p>
              </div>
              <a href="/agents" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Agents
              </a>
            </div>
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
        </div>
      </div>

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

function AlertRow({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-white/60 bg-white/70 px-3 py-2">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-600">{detail}</p>
      </div>
    </div>
  );
}
