import { ArrowUpRight, PhoneCall, PhoneOff, Users } from "lucide-react";
import { NumberBarChart } from "../../../components/number-bar-chart";
import { HourHeatmap } from "../../../components/hour-heatmap";
import { TrendChart } from "../../../components/trend-chart";
import { cn } from "../../../lib/utils";
import { loadMetrics } from "../../../lib/metrics";
import { requireAdminSession } from "../../../lib/auth";

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-900">Hi, welcome back</h1>
        </div>
        <div className="flex gap-2">
          <a
            href="/live"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <PhoneCall className="h-4 w-4" />
            Live feed
          </a>
          <a
            href="/call-logs"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Logs
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total calls" value={metrics.summary.total} helper="Last 7 days" delta={`${answeredPct - missedPct}%`} />
        <StatCard title="Answered" value={metrics.summary.answered} helper="Target ≥ 90%" delta={`${answeredPct}%`} tone="emerald" />
        <StatCard title="Missed" value={metrics.summary.missed} helper="Needs attention" delta={`-${missedPct}%`} tone="amber" />
        <StatCard title="Abandoned" value={metrics.summary.abandoned} helper="Before connect" delta={`-${abandonPct}%`} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader title="Bar chart" description="Answered vs missed vs voicemail (daily)" />
          <TrendChart data={metrics.trends} />
        </Card>
        <Card>
          <CardHeader title="Recent stats" description="Live roster & voicemail" />
          <div className="space-y-3">
            <MiniCard icon={<Users className="h-4 w-4 text-emerald-600" />} label="Active agents" value={metrics.agents.length} helper="Staff on roster" />
            <MiniCard icon={<PhoneOff className="h-4 w-4 text-amber-600" />} label="Voicemail" value={metrics.summary.voicemail} helper="Calls to voicemail" />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Traffic by number" description="Top tracked numbers by answered" />
          <NumberBarChart data={topNumbers} />
        </Card>
        <Card>
          <CardHeader title="Hourly load" description="Answered vs missed vs voicemail" pill="24h" />
          <HourHeatmap data={metrics.hours} />
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Agent leaderboard"
          description="Answered calls and speed"
          action={
            <a className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900" href="/agents">
              View all <ArrowUpRight className="h-3 w-3" />
            </a>
          }
        />
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
      </Card>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}>{children}</div>;
}

function CardHeader({
  title,
  description,
  pill,
  action
}: {
  title: string;
  description?: string;
  pill?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description ? <p className="text-xs text-slate-500">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {pill ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{pill}</span> : null}
        {action}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
  delta,
  tone
}: {
  title: string;
  value: number | string;
  helper?: string;
  delta?: string;
  tone?: "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 bg-emerald-50"
      : tone === "amber"
        ? "text-amber-700 bg-amber-50"
        : tone === "rose"
          ? "text-rose-700 bg-rose-50"
          : "text-slate-700 bg-slate-100";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
        </div>
        {delta ? <span className={cn("rounded-full px-2 py-1 text-[11px] font-semibold", toneClass)}>{delta}</span> : null}
      </div>
    </div>
  );
}

function MiniCard({
  icon,
  label,
  value,
  helper
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  helper?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
    </div>
  );
}
