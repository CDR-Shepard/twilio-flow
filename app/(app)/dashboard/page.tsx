import { format } from "date-fns";
import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";

export default async function DashboardPage() {
  const { supabase } = await requireAdminSession();

  const [{ count: trackedCount }, { count: agentCount }, callsTodayResponse, recentCallsResponse] =
    await Promise.all([
      supabase.from("tracked_numbers").select("id", { count: "exact", head: true }),
      supabase
        .from("agents")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabase
        .from("calls")
        .select("id", { count: "exact", head: true })
        .gte("started_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      supabase
        .from("calls")
        .select(
          "id, from_number, to_number, status, started_at, connected_agent_id, agents:connected_agent_id(full_name), tracked_numbers:tracked_number_id(friendly_name)"
        )
        .order("started_at", { ascending: false })
        .limit(10)
    ]);

  const recentCalls = recentCallsResponse.data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Tracked numbers">
          <div className="text-3xl font-bold">{trackedCount ?? 0}</div>
        </Card>
        <Card title="Active agents">
          <div className="text-3xl font-bold">{agentCount ?? 0}</div>
        </Card>
        <Card title="Calls today">
          <div className="text-3xl font-bold">{callsTodayResponse.count ?? 0}</div>
        </Card>
      </div>

      <Card title="Recent calls">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-1">Started</th>
                <th className="px-2 py-1">Caller</th>
                <th className="px-2 py-1">Tracked number</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1">Answered by</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((call) => (
                <tr key={call.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 text-slate-800">
                    {call.started_at ? format(new Date(call.started_at), "PP p") : "—"}
                  </td>
                  <td className="px-2 py-2">{call.from_number ?? "Unknown"}</td>
                  <td className="px-2 py-2">
                    {call.tracked_numbers?.friendly_name ?? call.to_number ?? "—"}
                  </td>
                  <td className="px-2 py-2 capitalize">{call.status}</td>
                  <td className="px-2 py-2">{call.agents?.full_name ?? "—"}</td>
                </tr>
              ))}
              {recentCalls.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-slate-500">
                    No calls logged yet.
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
