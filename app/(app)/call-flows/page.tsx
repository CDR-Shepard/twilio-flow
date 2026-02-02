import { notFound } from "next/navigation";
import { requireAdminSession } from "../../../lib/auth";
import { createFlow, updateFlowMeta, setFlowMembers } from "./actions";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { FlowMembersManager } from "../../../components/flow-members-manager";

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
      type: "simultaneous" | "sequential" | "round_robin";
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
        <form action={createFlow} className="grid gap-4 sm:grid-cols-[2fr_1.2fr_auto] items-end">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Name</label>
            <Input name="name" placeholder="Sales ring group" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Type</label>
            <select
              name="type"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800"
              defaultValue="simultaneous"
            >
              <option value="simultaneous">Simultaneous (waves)</option>
              <option value="sequential">Sequential</option>
            </select>
          </div>
          <div className="flex items-end pb-0">
            <Button type="submit" variant="primary" className="w-full">
              Create flow
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        {flows.map((flow) => {
          const members = [...(flow.call_flow_members ?? [])]
            .sort((a, b) => a.delay_seconds - b.delay_seconds || a.sort_order - b.sort_order)
            .map((m, idx) => ({
              agent_id: m.agent_id,
              delay_seconds: m.delay_seconds ?? 0,
              sort_order: m.sort_order ?? idx,
              active: m.active,
              name: m.agents?.full_name ?? "Unknown",
              phone: m.agents?.phone_number ?? ""
            }));
          return (
            <div key={flow.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
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

              <FlowMembersManager
                flowType={flow.type}
                initialMembers={members}
                agents={agents}
                onSave={setFlowMembers.bind(null, flow.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
