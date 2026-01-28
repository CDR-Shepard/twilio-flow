import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";
import { CallLogsTable } from "./CallLogsTable";

export default async function CallLogsPage({
  searchParams
}: {
  searchParams: { tracked_number_id?: string; status?: string; agent_id?: string; q?: string; from?: string; to?: string };
}) {
  const { supabase } = await requireAdminSession();

  type TrackedNumber = import("../../../lib/types/supabase").Database["public"]["Tables"]["tracked_numbers"]["Row"];
  type Agent = import("../../../lib/types/supabase").Database["public"]["Tables"]["agents"]["Row"];
  const { data: numbersData } = await supabase.from("tracked_numbers").select("id, friendly_name");
  const numbers: Pick<TrackedNumber, "id" | "friendly_name">[] = numbersData ?? [];
  const { data: agentsData } = await supabase.from("agents").select("id, full_name").eq("active", true);
  const agents: Pick<Agent, "id" | "full_name">[] = agentsData ?? [];

  let callsQuery = supabase
    .from("calls")
    .select(
      "id, from_number, to_number, status, started_at, ended_at, connected_agent_id, voicemail_url, recording_url, recording_sid, recording_duration_seconds, agents:connected_agent_id(full_name), tracked_numbers:tracked_number_id(friendly_name)"
    )
    .order("started_at", { ascending: false })
    .limit(100);

  if (searchParams.tracked_number_id) callsQuery = callsQuery.eq("tracked_number_id", searchParams.tracked_number_id);
  if (searchParams.status) callsQuery = callsQuery.eq("status", searchParams.status);
  if (searchParams.from) callsQuery = callsQuery.gte("started_at", searchParams.from);
  if (searchParams.to) callsQuery = callsQuery.lte("started_at", searchParams.to);
  if (searchParams.q) callsQuery = callsQuery.or(
    `from_number.ilike.%${searchParams.q}%,to_number.ilike.%${searchParams.q}%`
  );
  if (searchParams.agent_id) callsQuery = callsQuery.or(
    `connected_agent_id.eq.${searchParams.agent_id}`
  );

  const { data: callsData } = await callsQuery;

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
  };

  const calls: CallRow[] =
    (callsData as CallRow[] | null)?.map((c) => ({
      ...c,
      voicemail_url: c.voicemail_url ?? null,
      recording_url: c.recording_url ?? null,
      recording_sid: c.recording_sid ?? null,
      recording_duration_seconds: c.recording_duration_seconds ?? null
    })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">History</p>
        <h1 className="text-3xl font-bold text-slate-900">Call logs</h1>
        <p className="text-sm text-slate-600 flex items-center gap-2">
          Search by number or status; auto-refreshes in the background.
          <span className="glass-pill inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-emerald-700">
            ● Live
          </span>
        </p>
      </div>

      <Card className="glass-strong">
        <div className="flex flex-wrap gap-2 items-center">
          <form className="flex flex-wrap gap-2 items-center">
            <input
              name="q"
              defaultValue={searchParams.q ?? ""}
              placeholder="Search caller or number"
              className="glass-pill w-48 rounded-xl border border-white/60 px-3 py-2 text-sm"
            />
            <select name="tracked_number_id" defaultValue={searchParams.tracked_number_id ?? ""} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm">
              <option value="">All numbers</option>
              {numbers?.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.friendly_name}
                </option>
              ))}
            </select>
            <select name="agent_id" defaultValue={searchParams.agent_id ?? ""} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm">
              <option value="">Any agent</option>
              {agents?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={searchParams.status ?? ""} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm">
              <option value="">Any status</option>
              <option value="initiated">Initiated</option>
              <option value="ringing">Ringing</option>
              <option value="connected">Connected</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <input type="date" name="from" defaultValue={searchParams.from ?? ""} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm" />
            <input type="date" name="to" defaultValue={searchParams.to ?? ""} className="glass-pill rounded-xl border border-white/60 px-3 py-2 text-sm" />
            <button
              type="submit"
              className="glass-pill rounded-xl bg-brand-600/90 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Apply
            </button>
          </form>
        </div>
      </Card>

      <CallLogsTable initialCalls={calls} searchParams={searchParams} />
    </div>
  );
}
export const dynamic = "force-dynamic";
