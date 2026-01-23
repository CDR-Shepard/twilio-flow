import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { createAgent, toggleAgent, deleteAgent } from "./actions";
import clsx from "clsx";
import { AgentDeleteButton } from "../../../components/agent-delete-button";

export default async function AgentsPage() {
  const { supabase } = await requireAdminSession();
  const { data } = await supabase.from("agents").select("*").order("created_at", { ascending: false });
  type Agent = import("../../../lib/types/supabase").Database["public"]["Tables"]["agents"]["Row"];
  const agents: Agent[] = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">People</p>
          <h1 className="text-3xl font-bold text-slate-900">Agents</h1>
          <p className="text-sm text-slate-600">Manage who rings on your tracked numbers.</p>
        </div>
      </div>

      <Card title="Add agent" subtitle="Validate numbers; we’ll normalize to E.164">
        <form action={createAgent} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1 space-y-1">
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <Input name="full_name" placeholder="Alex Johnson" required />
          </div>
          <div className="sm:col-span-1 space-y-1">
            <label className="text-sm font-medium text-slate-700">Phone number</label>
            <Input name="phone_number" placeholder="+15551234567" required />
          </div>
          <div className="flex items-end sm:col-span-1">
            <Button type="submit" className="w-full sm:w-auto" variant="primary">
              Save agent
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Active agents" subtitle="Tap to toggle or remove">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-sticky">
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
                <tr key={agent.id} className="hover:bg-slate-50/50">
                  <td className="px-3 py-3 font-medium text-slate-900">{agent.full_name}</td>
                  <td className="px-3 py-3 text-slate-600">{agent.phone_number}</td>
                  <td className="px-3 py-3">
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                        agent.active ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-600"
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
      </Card>
    </div>
  );
}
export const dynamic = "force-dynamic";
