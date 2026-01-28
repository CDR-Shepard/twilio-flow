import { format } from "date-fns";
import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";

const statusStyle: Record<string, string> = {
  initiated: "bg-slate-100 text-slate-700",
  ringing: "bg-amber-100 text-amber-800",
  connected: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-rose-100 text-rose-800"
};

export default async function CallLogsPage({
  searchParams
}: {
  searchParams: { tracked_number_id?: string; status?: string };
}) {
  const { supabase } = await requireAdminSession();

  type TrackedNumber = import("../../../lib/types/supabase").Database["public"]["Tables"]["tracked_numbers"]["Row"];
  const { data: numbersData } = await supabase.from("tracked_numbers").select("id, friendly_name");
  const numbers: Pick<TrackedNumber, "id" | "friendly_name">[] = numbersData ?? [];

  let query = supabase
    .from("calls")
    .select(
      "id, from_number, to_number, status, started_at, ended_at, connected_agent_id, voicemail_url, recording_url, recording_sid, recording_duration_seconds, agents:connected_agent_id(full_name), tracked_numbers:tracked_number_id(friendly_name)"
    )
    .order("started_at", { ascending: false })
    .limit(50);

  if (searchParams.tracked_number_id) {
    query = query.eq("tracked_number_id", searchParams.tracked_number_id);
  }
  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data: callsData } = await query;
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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Call logs</h1>
            <p className="text-sm text-slate-600">Track who answered, duration, and listen back instantly.</p>
          </div>
          <div className="text-xs text-slate-500">
            Updated {format(new Date(), "PPpp")}
          </div>
        </div>
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

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-sticky">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-1">Started</th>
                <th className="px-2 py-1">Caller</th>
                <th className="px-2 py-1">Tracked number</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Answered by</th>
                <th className="px-2 py-1">Duration</th>
                <th className="px-2 py-1">Recording</th>
                <th className="px-2 py-1">Voicemail</th>
              </tr>
            </thead>
            <tbody>
              {calls?.map((call) => (
                <tr key={call.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-2 py-2">{format(new Date(call.started_at), "PP p")}</td>
                  <td className="px-2 py-2 font-mono text-sm">{call.from_number ?? "Unknown"}</td>
                  <td className="px-2 py-2">
                    {call.tracked_numbers?.friendly_name ?? call.to_number ?? "—"}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium capitalize ${
                        statusStyle[call.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {call.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">{call.agents?.full_name ?? "—"}</td>
                  <td className="px-2 py-2">
                    {call.ended_at
                      ? Math.round(
                          (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000
                        ) + "s"
                      : "—"}
                  </td>
                  <td className="px-2 py-2">
                    {call.recording_url ? (
                      <div className="space-y-1">
                        <audio
                          className="max-w-[240px]"
                          controls
                          preload="none"
                          src={
                            call.recording_sid
                              ? `/api/recordings/${call.recording_sid}`
                              : `${call.recording_url}.mp3`
                          }
                        />
                        {call.recording_duration_seconds ? (
                          <p className="text-xs text-slate-500">
                            {Math.round(call.recording_duration_seconds)}s
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-2">
                    {call.voicemail_url ? (
                      <audio className="max-w-[240px]" controls preload="none" src={`${call.voicemail_url}.mp3`} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {(!calls || calls.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-slate-500">
                    No calls yet.
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
export const dynamic = "force-dynamic";
