"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "../../../../lib/supabase/admin";

export async function updateCallFlow(trackedNumberId: string, agentIds: string[]) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin.from("tracked_number_routes").delete().eq("tracked_number_id", trackedNumberId);

  if (agentIds.length > 0) {
    const rows = agentIds.map((agentId, idx) => ({
      tracked_number_id: trackedNumberId,
      agent_id: agentId,
      sort_order: idx
    }));
    await supabaseAdmin.from("tracked_number_routes").insert(rows);
  }

  revalidatePath(`/tracked-numbers/${trackedNumberId}`);
}

export async function updateSettings(
  trackedNumberId: string,
  data: { greeting_text?: string; voicemail_enabled?: boolean; voicemail_prompt?: string }
) {
  const supabaseAdmin = getSupabaseAdmin();
  await supabaseAdmin
    .from("tracked_numbers")
    .update({
      greeting_text: data.greeting_text ?? null,
      voicemail_enabled: data.voicemail_enabled ?? false,
      voicemail_prompt: data.voicemail_prompt ?? null
    })
    .eq("id", trackedNumberId);
  revalidatePath(`/tracked-numbers/${trackedNumberId}`);
}
