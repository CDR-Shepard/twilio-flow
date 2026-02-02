import { notFound } from "next/navigation";
import { requireAdminSession } from "../../../lib/auth";
import { addFlowMember, createFlow, removeFlowMember, saveFlowMembers, updateFlowMeta } from "./actions";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

export default async function CallFlowsPage() {
  const { supabase } = await requireAdminSession();
  const { data: flowsData } = await supabase
    .from("call_flows")
    .select("id, name, type, active, call_flow_members(id, agent_id, delay_seconds, sort_order, active, agents(full_name, phone_number, active))")
    .order("created_at", { ascending: true });
  const flows =
    (flowsData as {
      id: string;
      name: string;
      type: string;
      active: boolean;
      call_flow_members: {
        id: string;
        agent_id: string;
        delay_seconds: number;
        sort_order: number;
        active: boolean;
        agents: { full_name: string; phone_number: string; active: boolean } | null;
      }[];
    }[] | null) ?? [];

  const { data: agentsData } = await supabase.from("agents").select("id, full_name, phone_number, active").order("full_name");
  const agents = (agentsData as { id: string; full_name: string; phone_number: string; active: boolean }[] | null) ?? [];

  if (!flows || !agents) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Routing</p>
          <h1 className="text-3xl font-semibold text-slate-900">Call flow groups</h1>
          <p className="text-sm text-slate-600">Create reusable ringing groups with per-agent delays.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form action={createFlow} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Name</label>
            <Input name="name" placeholder="Sales ring group" required />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Type</label>
            <select name="type" className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800" defaultValue="simultaneous">
              <option value="simultaneous">Simultaneous (waves)</option>
              <option value="sequential">Sequential</option>
            </select>
          </div>
          <Button type="submit" variant="primary">
            Create flow
          </Button>
        </form>
      </div>

      <div className="space-y-4">
        {flows.map((flow) => {
          const members = [...(flow.call_flow_members ?? [])].sort((a, b) => a.delay_seconds - b.delay_seconds || a.sort_order - b.sort_order);
          return (
            <div key={flow.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <form action={updateFlowMeta} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="flow_id" value={flow.id} />
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Name</label>
                    <Input name="name" defaultValue={flow.name} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Type</label>
                    <select name="type" className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800" defaultValue={flow.type}>
                      <option value="simultaneous">Simultaneous</option>
                      <option value="sequential">Sequential</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" name="active" defaultChecked={flow.active} /> Active
                  </label>
                  <Button type="submit" size="sm" variant="secondary">
                    Save
                  </Button>
                </form>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {members.length} member{members.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 overflow-x-auto">
                <form action={saveFlowMembers}>
                  <input type="hidden" name="flow_id" value={flow.id} />
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Agent</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2">Delay (s)</th>
                        <th className="px-3 py-2">Order</th>
                        <th className="px-3 py-2">Active</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((m, idx) => (
                        <tr key={m.id} className="align-middle">
                          <input type="hidden" name="member_id" value={m.id} />
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-900">{m.agents?.full_name ?? "Unknown"}</div>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{m.agents?.phone_number ?? "—"}</td>
                          <td className="px-3 py-2">
                            <Input name="delay_seconds" type="number" min="0" max="60" className="w-20" defaultValue={m.delay_seconds} />
                          </td>
                          <td className="px-3 py-2">
                            <Input name="sort_order" type="number" className="w-20" defaultValue={m.sort_order ?? idx} />
                          </td>
                          <td className="px-3 py-2">
                            <label className="flex items-center gap-1 text-sm text-slate-700">
                              <input type="checkbox" name={`active_${m.id}`} defaultChecked={m.active} />
                              Active
                            </label>
                          </td>
                          <td className="px-3 py-2 text-right space-x-2">
                            <Button type="submit" size="sm" variant="ghost" name="member_id" value={m.id} formAction={removeFlowMember}>
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {members.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-center text-slate-500">
                            No members yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {members.length > 0 && (
                    <div className="mt-3 text-right">
                      <Button type="submit" size="sm" variant="secondary">
                        Save member changes
                      </Button>
                    </div>
                  )}
                </form>
              </div>

              <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
                <form action={addFlowMember} className="flex flex-wrap items-end gap-2">
                  <input type="hidden" name="flow_id" value={flow.id} />
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Agent</label>
                    <select name="agent_id" className="rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800" defaultValue="">
                      <option value="" disabled>
                        Select agent
                      </option>
                      {agents
                        .filter((a) => a.active)
                        .map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.full_name} ({a.phone_number})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Delay (seconds)</label>
                    <Input name="delay_seconds" type="number" min="0" max="60" defaultValue={0} className="w-24" />
                  </div>
                  <Button type="submit" size="sm" variant="primary">
                    Add member
                  </Button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
