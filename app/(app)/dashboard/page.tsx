import { requireAdminSession } from "../../../lib/auth";
import { loadMetrics } from "../../../lib/metrics";
import { TrendChart } from "../../../components/trend-chart";
import { NumberBarChart } from "../../../components/number-bar-chart";
import { HourHeatmap } from "../../../components/hour-heatmap";
import { PhoneCall, Voicemail, PhoneMissed, Clock4, AlertTriangle, Sparkles, Wand2, Phone } from "lucide-react";
import { BentoCard, BentoGrid } from "../../../components/magic/bento-grid";
import { motion } from "framer-motion";
import { cn } from "../../../lib/utils";

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
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.14)] ring-1 ring-white/60 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.12),transparent_35%),radial-gradient(circle_at_70%_0%,rgba(14,165,233,0.14),transparent_32%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.14),transparent_35%)]" />
        <div className="relative flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="tag">Live Pulse</span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Auto-refresh</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Call Performance</h1>
          <p className="text-sm text-slate-600">
            Answer rates, misses, voicemail and speed—instrumented for the last {presetLinks[1].label.toLowerCase()} by default.
          </p>
          <form className="flex flex-wrap items-center gap-2 pt-2" method="get">
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
        </div>
      </div>

      <BentoGrid>
        <BentoCard
          title="Answer velocity"
          description="Response speed to inbound calls."
          icon={<Clock4 className="h-5 w-5" />}
          className="md:col-span-2"
        >
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Avg answer" value={formatSeconds(metrics.summary.avg_answer_sec)} accent="text-indigo-700" />
            <Kpi label="Voicemail" value={metrics.summary.voicemail} accent="text-slate-800" icon={<Voicemail className="h-4 w-4" />} />
          </div>
        </BentoCard>

        <BentoCard
          title="Today"
          description="Pulse on the latest interval."
          icon={<Sparkles className="h-5 w-5" />}
          className="md:col-span-2"
        >
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Total" value={metrics.summary.total} />
            <Kpi label="Answered" value={metrics.summary.answered} accent="text-emerald-700" icon={<PhoneCall className="h-4 w-4" />} />
            <Kpi label="Missed" value={metrics.summary.missed} accent="text-amber-700" icon={<PhoneMissed className="h-4 w-4" />} />
          </div>
        </BentoCard>

        <BentoCard
          title="Risk & abandonment"
          description="Abandoned before connect."
          icon={<AlertTriangle className="h-5 w-5" />}
          className="md:col-span-2"
        >
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Abandoned" value={metrics.summary.abandoned} accent="text-rose-700" />
            <Kpi label="Missed %" value={`${metrics.summary.total ? Math.round((metrics.summary.missed / metrics.summary.total) * 100) : 0}%`} accent="text-amber-700" />
          </div>
        </BentoCard>
      </BentoGrid>

      <BentoGrid className="md:grid-cols-12">
        <BentoCard
          title="Trends"
          description="Answered vs missed vs voicemail"
          icon={<Wand2 className="h-5 w-5" />}
          className="md:col-span-7"
          subtle
        >
          <div className="surface mt-3 p-2">
            <TrendChart data={metrics.trends} />
          </div>
        </BentoCard>

        <BentoCard
          title="Per-number performance"
          description="Top tracked numbers by answered calls"
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
          icon={<PhoneCall className="h-5 w-5" />}
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
                      <td colSpan={3} className="px-3 py-4 text-center text-slate-500">No agent activity yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </BentoCard>

        <BentoCard
          title="Hourly heatmap"
          description="Answered vs missed vs voicemail by hour"
          icon={<Clock4 className="h-5 w-5" />}
          className="md:col-span-5"
          subtle
        >
          <div className="surface mt-3 p-2">
            <HourHeatmap data={metrics.hours} />
          </div>
        </BentoCard>
      </BentoGrid>
    </div>
  );
}

function Kpi({ label, value, accent, icon }: { label: string; value: number | string; accent?: string; icon?: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/60 bg-white/80 p-3 shadow-md ring-1 ring-white/60 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
        {icon ? <span className="text-slate-600">{icon}</span> : null}
      </div>
      <p className={cn("text-2xl font-bold text-slate-900", accent)}>{value}</p>
    </motion.div>
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
