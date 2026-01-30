import clsx from "clsx";
import { AgentDeleteButton } from "../../../components/agent-delete-button";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { requireAdminSession } from "../../../lib/auth";
import { createAgent, toggleAgent } from "./actions";

export default async function AgentsPage() {
  const { supabase } = await requireAdminSession();
  const { data } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
  type Agent = import("../../../lib/types/supabase").Database["public"]["Tables"]["agents"]["Row"];
  const agents: Agent[] = data ?? [];

  const activeCount = agents.filter((a) => a.active).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">People</p>
          <h1 className="text-3xl font-semibold text-slate-900">Agent directory</h1>
          <p className="text-sm text-slate-600">Control who can receive routed calls.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          Active: {activeCount} / {agents.length}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.95fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Add agent</p>
            <p className="text-sm text-slate-600">Numbers are normalized to E.164.</p>
          </div>
          <form action={createAgent} className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Full name</label>
              <Input name="full_name" placeholder="Ava Johnson" required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">Phone number</label>
              <Input name="phone_number" placeholder="+15551234567" required />
            </div>
            <Button type="submit" className="w-full" variant="primary">
              Save agent
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Agents</p>
              <p className="text-sm font-semibold text-slate-800">Tap to manage routing</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Phone</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{agent.full_name}</td>
                    <td className="px-3 py-3 text-slate-600">{agent.phone_number}</td>
                    <td className="px-3 py-3">
                      <span
                        className={clsx(
                          "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                          agent.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {agent.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 space-x-2 text-right">
                      <form action={toggleAgent.bind(null, agent.id, !agent.active)} className="inline">
                        <Button type="submit" variant="secondary" size="sm">
                          {agent.active ? "Deactivate" : "Activate"}
                        </Button>
                      </form>
                      <AgentDeleteButton id={agent.id} />
                    </td>
                  </tr>
                ))}
                {(!agents || agents.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                      No agents yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
export const dynamic = "force-dynamic";
