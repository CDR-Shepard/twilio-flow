import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";
import { loadMetrics } from "../../../lib/metrics";
import { TrendChart } from "../../../components/trend-chart";

function formatSeconds(value: number | null) {
  if (value == null) return "—";
  if (value < 60) return `${value}s`;
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}m ${secs}s`;
}

export default async function DashboardPage() {
  const { supabase } = await requireAdminSession();
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 6);

  const metrics = await loadMetrics(supabase, { from: from.toISOString(), to: to.toISOString() });

  const topAgents = metrics.agents.sort((a, b) => b.answered - a.answered).slice(0, 5);
  const topNumbers = metrics.numbers.sort((a, b) => b.answered - a.answered).slice(0, 5);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Overview</p>
        <h1 className="text-3xl font-bold text-slate-900">Sales Call Performance</h1>
        <p className="text-sm text-slate-600">
          Who answered, what was missed, and how fast. Last 7 days (auto-calculated).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total" value={metrics.summary.total} />
        <Kpi label="Answered" value={metrics.summary.answered} accent="text-emerald-600" />
        <Kpi label="Missed" value={metrics.summary.missed} accent="text-amber-600" />
        <Kpi label="Abandoned" value={metrics.summary.abandoned} accent="text-rose-600" />
        <Kpi label="Voicemail" value={metrics.summary.voicemail} />
        <Kpi label="Avg answer" value={formatSeconds(metrics.summary.avg_answer_sec)} />
      </div>

      <Card title="Trends" subtitle="Answered vs missed, last 7 days">
        <TrendChart trends={metrics.trends} />
        <div className="flex gap-4 text-xs text-slate-500 px-2">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-600" />Answered</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />Missed</span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Agent leaderboard" subtitle="Answered calls and avg answer time">
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
                    <td colSpan={3} className="px-3 py-4 text-center text-slate-500">No agent activity yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Tracked numbers" subtitle="Answered vs missed">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Number</th>
                  <th className="px-3 py-2">Answered</th>
                  <th className="px-3 py-2">Missed</th>
                  <th className="px-3 py-2">Voicemail</th>
                </tr>
              </thead>
              <tbody>
                {topNumbers.map((n) => (
                  <tr key={n.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">{n.label}</td>
                    <td className="px-3 py-2">{n.answered}</td>
                    <td className="px-3 py-2">{n.missed}</td>
                    <td className="px-3 py-2">{n.voicemail}</td>
                  </tr>
                ))}
                {topNumbers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500">No calls yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
    </Card>
  );
}

export const dynamic = "force-dynamic";
