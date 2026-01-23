import { notFound } from "next/navigation";
import { requireAdminSession } from "../../../../lib/auth";
import { CallFlowBuilder } from "./builder";
import { updateCallFlow, updateSettings } from "./actions";
import { Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";

export default async function TrackedNumberDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdminSession();

  type TrackedNumberRow = import("../../../../lib/types/supabase").Database["public"]["Tables"]["tracked_numbers"]["Row"];
  const { data: trackedNumberData } = await supabase
    .from("tracked_numbers")
    .select("*")
    .eq("id", params.id)
    .single();
  const trackedNumber = trackedNumberData as TrackedNumberRow | null;
  if (!trackedNumber) return notFound();

  const { data: routesData } = await supabase
    .from("tracked_number_routes")
    .select("agent_id, sort_order, agents(*)")
    .eq("tracked_number_id", params.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  type RouteRow = {
    agent_id: string;
    sort_order: number;
    agents?: { full_name: string; phone_number: string };
  };
  const routes: RouteRow[] = routesData ?? [];

  const { data: activeAgentsData } = await supabase
    .from("agents")
    .select("*")
    .eq("active", true)
    .order("full_name");
  type AgentRow = import("../../../../lib/types/supabase").Database["public"]["Tables"]["agents"]["Row"];
  const activeAgents: AgentRow[] = activeAgentsData ?? [];

  const selected = (routes ?? [])
    .map((r) => ({
      id: r.agent_id,
      full_name: r.agents?.full_name ?? "",
      phone_number: r.agents?.phone_number ?? ""
    }))
    .filter((r) => !!r.full_name);

  const selectedIds = new Set(selected.map((s) => s.id));
  const available =
    activeAgents
      ?.filter((a) => !selectedIds.has(a.id))
      .map((a) => ({ id: a.id, full_name: a.full_name, phone_number: a.phone_number })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-500">Tracked number</p>
        <h1 className="text-3xl font-bold text-slate-900">
          {trackedNumber.friendly_name} ({trackedNumber.twilio_phone_number})
        </h1>
      </div>

      <Card title="Call settings" subtitle="Greeting and voicemail">
        <form className="grid gap-4 md:grid-cols-2" action={async (formData) => {
          "use server";
          await updateSettings(trackedNumber.id, {
            greeting_text: (formData.get("greeting_text") as string) || undefined,
            voicemail_enabled: formData.get("voicemail_enabled") === "on",
            voicemail_prompt: (formData.get("voicemail_prompt") as string) || undefined
          });
        }}>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-semibold text-slate-800">Greeting (played first)</label>
            <Input name="greeting_text" defaultValue={trackedNumber.greeting_text ?? ""} placeholder="Thanks for calling..." />
            <p className="text-xs text-slate-500">We’ll use Twilio TTS to play this.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <input type="checkbox" name="voicemail_enabled" defaultChecked={trackedNumber.voicemail_enabled ?? false} />
              Enable voicemail if no one answers
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-800">Voicemail prompt</label>
            <Input name="voicemail_prompt" defaultValue={trackedNumber.voicemail_prompt ?? "Please leave a message after the tone."} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save settings</Button>
          </div>
        </form>
      </Card>

      <CallFlowBuilder initialAvailable={available} initialSelected={selected} onSave={updateCallFlow.bind(null, params.id)} />
    </div>
  );
}
export const dynamic = "force-dynamic";
