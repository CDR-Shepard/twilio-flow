import { PhoneCall, PhoneOff, Users } from "lucide-react";
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
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operations</p>
          <h1 className="text-3xl font-bold text-slate-900">Routing overview</h1>
          <p className="text-sm text-slate-600">7-day pulse of answer health, speed, and staffing.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/live"
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <PhoneCall className="h-4 w-4" />
            Live feed
          </a>
          <a
            href="/call-logs"
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            Logs
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Answer rate" value={`${answeredPct}%`} helper={`${metrics.summary.answered} answered`} tone="emerald" />
        <Kpi label="Avg answer" value={formatSeconds(metrics.summary.avg_answer_sec)} helper="Speed to connect" />
        <Kpi label="Missed" value={`${missedPct}%`} helper={`${metrics.summary.missed} calls`} tone="amber" />
        <Kpi label="Abandoned" value={`${abandonPct}%`} helper={`${metrics.summary.abandoned} calls`} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Trend" description="Answered vs missed vs voicemail" pill="Daily" />
          <TrendChart data={metrics.trends} />
        </Card>
        <Card>
          <CardHeader title="Hourly load" description="Answered vs missed vs voicemail" pill="24h" />
          <HourHeatmap data={metrics.hours} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top numbers"
            description="Tracked numbers by answered calls"
            action={
              <a className="text-sm font-semibold text-slate-700 hover:text-slate-900" href="/tracked-numbers">
                Manage
              </a>
            }
          />
          <NumberBarChart data={topNumbers} />
        </Card>

        <Card>
          <CardHeader
            title="Agent leaderboard"
            description="Answered calls and speed"
            action={
              <a className="text-sm font-semibold text-slate-700 hover:text-slate-900" href="/agents">
                Agents
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

      <div className="grid gap-4 md:grid-cols-2">
        <MiniCard
          icon={<Users className="h-4 w-4 text-emerald-600" />}
          label="Active agents"
          value={metrics.agents.length}
          helper="Staff on roster"
        />
        <MiniCard
          icon={<PhoneOff className="h-4 w-4 text-amber-600" />}
          label="Voicemail"
          value={metrics.summary.voicemail}
          helper="Calls to voicemail"
        />
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  helper,
  tone
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "emerald" | "amber" | "rose";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "amber"
        ? "text-amber-700"
        : tone === "rose"
          ? "text-rose-700"
          : "text-slate-900";
  const barClass =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "amber"
        ? "bg-amber-100 text-amber-800"
        : tone === "rose"
          ? "bg-rose-100 text-rose-800"
          : "bg-slate-100 text-slate-800";
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", toneClass)}>{value}</p>
      {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={cn("h-full rounded-full", barClass)} style={{ width: "100%" }} />
      </div>
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
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
        <p className="text-lg font-bold text-slate-900">{value}</p>
        {helper ? <p className="text-xs text-slate-500">{helper}</p> : null}
      </div>
    </div>
  );
}
