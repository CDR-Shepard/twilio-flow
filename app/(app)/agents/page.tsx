import { requireAdminSession } from "../../../lib/auth";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { createAgent, toggleAgent, deleteAgent } from "./actions";

export default async function AgentsPage() {
  const { supabase } = await requireAdminSession();
  const { data: agents } = await supabase.from("agents").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Agents</h1>

      <Card title="Add agent">
        <form action={createAgent} className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <Input name="full_name" placeholder="Alex Johnson" required />
          </div>
          <div className="sm:col-span-1">
            <label className="text-sm font-medium text-slate-700">Phone number (E.164 or US)</label>
            <Input name="phone_number" placeholder="+15551234567" required />
          </div>
          <div className="flex items-end sm:col-span-1">
            <Button type="submit" className="w-full sm:w-auto">
              Save
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Active agents">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-2 py-1">Name</th>
                <th className="px-2 py-1">Phone</th>
                <th className="px-2 py-1">Status</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {agents?.map((agent) => (
                <tr key={agent.id} className="border-t border-slate-100">
                  <td className="px-2 py-2">{agent.full_name}</td>
                  <td className="px-2 py-2">{agent.phone_number}</td>
                  <td className="px-2 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                      {agent.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-2 py-2 space-x-2 text-right">
                    <form action={toggleAgent.bind(null, agent.id, !agent.active)} className="inline">
                      <Button type="submit" variant="secondary">
                        {agent.active ? "Deactivate" : "Activate"}
                      </Button>
                    </form>
                    <form action={deleteAgent.bind(null, agent.id)} className="inline">
                      <Button type="submit" variant="ghost">
                        Delete
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!agents || agents.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-center text-slate-500">
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
