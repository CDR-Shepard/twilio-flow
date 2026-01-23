import { format } from "date-fns";
import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";

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
      "id, from_number, to_number, status, started_at, ended_at, connected_agent_id, voicemail_url, agents:connected_agent_id(full_name), tracked_numbers:tracked_number_id(friendly_name)"
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
  };
  const calls: CallRow[] = (callsData as CallRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">History</p>
        <h1 className="text-3xl font-bold text-slate-900">Call logs</h1>
        <p className="text-sm text-slate-600">Search by number or status to find who answered and how long.</p>
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
                <th className="px-2 py-1">Voicemail</th>
              </tr>
            </thead>
            <tbody>
              {calls?.map((call) => (
                <tr key={call.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">{format(new Date(call.started_at), "PP p")}</td>
                  <td className="px-2 py-2">{call.from_number ?? "Unknown"}</td>
                  <td className="px-2 py-2">
                    {call.tracked_numbers?.friendly_name ?? call.to_number ?? "—"}
                  </td>
                  <td className="px-2 py-2 capitalize">{call.status}</td>
                  <td className="px-2 py-2">{call.agents?.full_name ?? "—"}</td>
                  <td className="px-2 py-2">
                    {call.ended_at
                      ? Math.round(
                          (new Date(call.ended_at).getTime() - new Date(call.started_at).getTime()) / 1000
                        ) + "s"
                      : "—"}
                  </td>
                  <td className="px-2 py-2">
                    {call.voicemail_url ? (
                      <a
                        className="text-brand-600 hover:text-brand-700"
                        href={`${call.voicemail_url}.mp3`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Play
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {(!calls || calls.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-center text-slate-500">
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
