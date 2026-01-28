import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";
import { CallLogsTable } from "./CallLogsTable";

export default async function CallLogsPage({
  searchParams
}: {
  searchParams: { tracked_number_id?: string; status?: string };
}) {
  const { supabase } = await requireAdminSession();

  type TrackedNumber = import("../../../lib/types/supabase").Database["public"]["Tables"]["tracked_numbers"]["Row"];
  const { data: numbersData } = await supabase.from("tracked_numbers").select("id, friendly_name");
  const numbers: Pick<TrackedNumber, "id" | "friendly_name">[] = numbersData ?? [];

  const { data: callsData } = await supabase
    .from("calls")
    .select(
      "id, from_number, to_number, status, started_at, ended_at, connected_agent_id, voicemail_url, recording_url, recording_sid, recording_duration_seconds, agents:connected_agent_id(full_name), tracked_numbers:tracked_number_id(friendly_name)"
    )
    .order("started_at", { ascending: false })
    .limit(100);

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
        <p className="text-sm text-slate-600">Search by number or status; auto-refreshes in the background.</p>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3">
          <form className="flex gap-2">
            <select name="tracked_number_id" defaultValue={searchParams.tracked_number_id ?? ""} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
              <option value="">All numbers</option>
              {numbers?.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.friendly_name}
                </option>
              ))}
            </select>
            <select name="status" defaultValue={searchParams.status ?? ""} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
              <option value="">Any status</option>
              <option value="initiated">Initiated</option>
              <option value="ringing">Ringing</option>
              <option value="connected">Connected</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Filter
            </button>
          </form>
        </div>
      </Card>

      <CallLogsTable initialCalls={calls} searchParams={searchParams} />
    </div>
  );
}
export const dynamic = "force-dynamic";
