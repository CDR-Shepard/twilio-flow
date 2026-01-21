"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { normalizeE164 } from "../../../lib/phone";

export async function createAgent(formData: FormData) {
  const name = (formData.get("full_name") as string) ?? "";
  const phone = (formData.get("phone_number") as string) ?? "";
  const normalized = normalizeE164(phone);
  if (!normalized) throw new Error("Invalid phone number");

  await supabaseAdmin.from("agents").insert({ full_name: name, phone_number: normalized });
  revalidatePath("/agents");
}

export async function toggleAgent(id: string, active: boolean) {
  await supabaseAdmin.from("agents").update({ active }).eq("id", id);
  revalidatePath("/agents");
}

export async function deleteAgent(id: string) {
  await supabaseAdmin.from("agents").delete().eq("id", id);
  revalidatePath("/agents");
}
