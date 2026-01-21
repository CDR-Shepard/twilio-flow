import { notFound } from "next/navigation";
import { requireAdminSession } from "../../../../lib/auth";
import { CallFlowBuilder } from "./builder";
import { updateCallFlow } from "./actions";

export default async function TrackedNumberDetailPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdminSession();

  const { data: trackedNumber } = await supabase.from("tracked_numbers").select("*").eq("id", params.id).single();
  if (!trackedNumber) return notFound();

  const { data: routes } = await supabase
    .from("tracked_number_routes")
    .select("agent_id, sort_order, agents(*)")
    .eq("tracked_number_id", params.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const { data: activeAgents } = await supabase
    .from("agents")
    .select("*")
    .eq("active", true)
    .order("full_name");

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
        <h1 className="text-2xl font-semibold text-slate-900">
          {trackedNumber.friendly_name} ({trackedNumber.twilio_phone_number})
        </h1>
      </div>

      <CallFlowBuilder
        trackedNumberId={params.id}
        initialAvailable={available}
        initialSelected={selected}
        onSave={updateCallFlow.bind(null, params.id)}
      />
    </div>
  );
}
