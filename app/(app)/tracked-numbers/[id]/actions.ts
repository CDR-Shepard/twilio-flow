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
