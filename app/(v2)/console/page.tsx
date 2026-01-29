import { requireAdminSession } from "../../../lib/auth";
import { loadMetrics } from "../../../lib/metrics";
import { LivePill } from "../../../components/magic/live-pill";
import { TrendChart } from "../../../components/trend-chart";
import { NumberBarChart } from "../../../components/number-bar-chart";
import { HourHeatmap } from "../../../components/hour-heatmap";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Console</p>
          <h1 className="text-3xl font-bold text-slate-900">Routing health</h1>
          <p className="text-sm text-slate-600">Minimal view of answer performance and agent responsiveness.</p>
        </div>
        <div className="flex items-center gap-3">
          <LivePill label="Live" />
          <a
            href="/live"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:border-slate-300"
          >
            Live feed
          </a>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi title="Answer rate" value={`${answeredPct}%`} helper="Target ≥ 90%" />
        <Kpi title="Missed" value={`${missedPct}%`} helper={`${metrics.summary.missed} calls`} tone="amber" />
        <Kpi title="Abandoned" value={`${abandonPct}%`} helper={`${metrics.summary.abandoned} calls`} tone="rose" />
        <Kpi title="Avg answer" value={formatSeconds(metrics.summary.avg_answer_sec)} helper="Speed to connect" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="surface p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm font-semibold text-slate-800">Trend</span>
            <span className="text-xs text-slate-500">Daily</span>
          </div>
          <TrendChart data={metrics.trends} />
        </div>
        <div className="surface p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm font-semibold text-slate-800">Hourly load</span>
            <span className="text-xs text-slate-500">24h</span>
          </div>
          <HourHeatmap data={metrics.hours} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="surface p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm font-semibold text-slate-800">Top numbers</span>
            <a href="/tracked-numbers" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
              View all
            </a>
          </div>
          <NumberBarChart data={topNumbers} />
        </div>
        <div className="surface p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="text-sm font-semibold text-slate-800">Agent leaderboard</span>
            <a href="/agents" className="text-xs font-semibold text-slate-700 hover:text-slate-900">
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
  );
}

function Kpi({ title, value, helper, tone }: { title: string; value: string; helper?: string; tone?: "amber" | "rose" }) {
  const toneClass = tone === "amber" ? "text-amber-700" : tone === "rose" ? "text-rose-700" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <p className={cn("text-2xl font-bold", toneClass)}>{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
    </div>
  );
}
