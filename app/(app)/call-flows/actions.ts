"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "../../../lib/supabase/admin";

export async function createFlow(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const type = ((formData.get("type") as string) || "simultaneous") as "simultaneous" | "sequential" | "round_robin";
  if (!name) return;
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("call_flows").insert({ name, type });
  revalidatePath("/call-flows");
}

export async function updateFlowMeta(formData: FormData) {
  const flowId = formData.get("flow_id") as string;
  if (!flowId) return;
  const name = (formData.get("name") as string)?.trim();
  const type = (formData.get("type") as string) || "simultaneous";
  const active = formData.get("active") === "on";
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("call_flows").update({ name, type, active }).eq("id", flowId);
  revalidatePath("/call-flows");
}

export async function addFlowMember(formData: FormData) {
  const flowId = formData.get("flow_id") as string;
  const agentId = formData.get("agent_id") as string;
  if (!flowId || !agentId) return;
  const delay = Number(formData.get("delay_seconds") || "0");
  const supabaseAdmin = getSupabaseAdmin();
  // place new member at end
  const { data: last } = await supabaseAdmin
    .from("call_flow_members")
    .select("sort_order")
    .eq("call_flow_id", flowId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (last?.sort_order ?? 0) + 1;
  await supabaseAdmin
    .from("call_flow_members")
    .upsert({ call_flow_id: flowId, agent_id: agentId, delay_seconds: delay, sort_order: nextOrder, active: true });
  revalidatePath("/call-flows");
}

export async function updateFlowMember(formData: FormData) {
  const memberId = formData.get("member_id") as string;
  const flowId = formData.get("flow_id") as string;
  if (!memberId || !flowId) return;
  const delay = Number(formData.get("delay_seconds") || "0");
  const sortOrder = Number(formData.get("sort_order") || "0");
  const active = formData.get("active") === "on";
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin
    .from("call_flow_members")
    .update({ delay_seconds: delay, sort_order: sortOrder, active })
    .eq("id", memberId);
  revalidatePath("/call-flows");
}

export async function removeFlowMember(formData: FormData) {
  const memberId = formData.get("member_id") as string;
  if (!memberId) return;
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("call_flow_members").delete().eq("id", memberId);
  revalidatePath("/call-flows");
}

export async function saveFlowMembers(formData: FormData) {
  const flowId = formData.get("flow_id") as string;
  if (!flowId) return;
  const memberIds = formData.getAll("member_id") as string[];
  const delays = formData.getAll("delay_seconds") as string[];
  const orders = formData.getAll("sort_order") as string[];
  const supabaseAdmin = getSupabaseAdmin();

  const updates = memberIds.map((id, idx) => ({
    id,
    delay_seconds: Number(delays[idx] || "0"),
    sort_order: Number(orders[idx] || `${idx}`),
    active: formData.get(`active_${id}`) === "on"
  }));

  for (const u of updates) {
    await supabaseAdmin
      .from("call_flow_members")
      .update({ delay_seconds: u.delay_seconds, sort_order: u.sort_order, active: u.active })
      .eq("id", u.id);
  }
  revalidatePath("/call-flows");
}
