import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";
import { loadMetrics } from "../../../lib/metrics";
import { TrendChart } from "../../../components/trend-chart";
import { NumberBarChart } from "../../../components/number-bar-chart";
import { HourHeatmap } from "../../../components/hour-heatmap";
import { PhoneCall, Voicemail, PhoneMissed, Clock4, AlertTriangle, Percent } from "lucide-react";

function formatSeconds(value: number | null) {
  if (value == null) return "—";
  if (value < 60) return `${value}s`;
  const mins = Math.floor(value / 60);
  const secs = value % 60;
  return `${mins}m ${secs}s`;
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: { from?: string; to?: string; tracked_number_id?: string; agent_id?: string };
}) {
  const { supabase } = await requireAdminSession();
  const to = searchParams?.to ? new Date(searchParams.to) : new Date();
  const from = searchParams?.from ? new Date(searchParams.from) : new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000);

  const metrics = await loadMetrics(supabase, { from: from.toISOString(), to: to.toISOString(), tracked_number_id: searchParams?.tracked_number_id, agent_id: searchParams?.agent_id });

  type TrackedNumber = import("../../../lib/types/supabase").Database["public"]["Tables"]["tracked_numbers"]["Row"];
  type Agent = import("../../../lib/types/supabase").Database["public"]["Tables"]["agents"]["Row"];
  const [{ data: numbersData }, { data: agentsData }] = await Promise.all([
    supabase.from("tracked_numbers").select("id, friendly_name"),
    supabase.from("agents").select("id, full_name").eq("active", true)
  ]);
  const numbers: Pick<TrackedNumber, "id" | "friendly_name">[] = numbersData ?? [];
  const agents: Pick<Agent, "id" | "full_name">[] = agentsData ?? [];
  const topAgents = metrics.agents.sort((a, b) => b.answered - a.answered).slice(0, 5);
  const topNumbers = metrics.numbers.sort((a, b) => b.answered - a.answered).slice(0, 8);
  const presetLinks = buildPresets(searchParams);

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Overview</p>
        <h1 className="text-3xl font-bold text-slate-900">Sales Call Performance</h1>
        <p className="text-sm text-slate-600">
          Who answered, what was missed, and how fast. Choose a range to drill in.
        </p>
      </div>

      <Card className="glass-strong">
        <form className="flex flex-wrap items-center gap-2" method="get">
          <div className="flex flex-wrap gap-2">
            {presetLinks.map((p) => (
              <a
                key={p.label}
                href={p.href}
                className="glass-pill rounded-full px-3 py-2 text-sm font-medium text-slate-800 hover:ring-1 hover:ring-white/70"
              >
                {p.label}
              </a>
            ))}
          </div>
          <input type="date" name="from" defaultValue={from.toISOString().slice(0, 10)} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm" />
          <input type="date" name="to" defaultValue={to.toISOString().slice(0, 10)} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm" />
          <select name="tracked_number_id" defaultValue={searchParams?.tracked_number_id ?? ""} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm">
            <option value="">All numbers</option>
            {numbers.map((n) => (
              <option key={n.id} value={n.id}>
                {n.friendly_name}
              </option>
            ))}
          </select>
          <select name="agent_id" defaultValue={searchParams?.agent_id ?? ""} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm">
            <option value="">Any agent</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name}
              </option>
            ))}
          </select>
          <button type="submit" className="glass-pill rounded-xl bg-brand-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600">
            Apply
          </button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total" value={metrics.summary.total} />
        <Kpi label="Answered" value={metrics.summary.answered} accent="text-emerald-600" icon={<PhoneCall className="h-4 w-4" />} />
        <Kpi label="Missed" value={metrics.summary.missed} accent="text-amber-600" icon={<PhoneMissed className="h-4 w-4" />} />
        <Kpi label="Abandoned" value={metrics.summary.abandoned} accent="text-rose-600" icon={<AlertTriangle className="h-4 w-4" />} />
        <Kpi label="Voicemail" value={metrics.summary.voicemail} icon={<Voicemail className="h-4 w-4" />} />
        <Kpi label="Avg answer" value={formatSeconds(metrics.summary.avg_answer_sec)} icon={<Clock4 className="h-4 w-4" />} />
      </div>

      <Card title="Trends" subtitle="Answered vs missed vs voicemail">
        <TrendChart data={metrics.trends} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Per-number performance" subtitle="Top 8 tracked numbers by answered calls">
          <NumberBarChart data={topNumbers} />
        </Card>

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

        <Card title="Hourly heatmap" subtitle="Answered vs missed vs voicemail by hour">
          <HourHeatmap data={metrics.hours} />
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent, icon }: { label: string; value: number | string; accent?: string; icon?: React.ReactNode }) {
  return (
    <Card className="glass-pill">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
        {icon ? <span className="text-slate-600">{icon}</span> : null}
      </div>
      <p className={`text-3xl font-bold ${accent ?? "text-slate-900"}`}>{value}</p>
    </Card>
  );
}

export const dynamic = "force-dynamic";

function buildPresets(searchParams?: { tracked_number_id?: string; agent_id?: string }) {
  const base = new URLSearchParams();
  if (searchParams?.tracked_number_id) base.set("tracked_number_id", searchParams.tracked_number_id);
  if (searchParams?.agent_id) base.set("agent_id", searchParams.agent_id);

  const make = (label: string, days: number) => {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    const qs = new URLSearchParams(base);
    qs.set("from", from.toISOString().slice(0, 10));
    qs.set("to", to.toISOString().slice(0, 10));
    return { label, href: `/dashboard?${qs.toString()}` };
  };

  return [make("Today", 1), make("7 days", 7), make("30 days", 30)];
}
