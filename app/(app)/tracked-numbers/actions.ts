"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../../../lib/supabase/admin";
import { normalizeE164 } from "../../../lib/phone";

export async function createTrackedNumber(formData: FormData) {
  const friendly_name = (formData.get("friendly_name") as string) ?? "";
  const phone = (formData.get("twilio_phone_number") as string) ?? "";
  const normalized = normalizeE164(phone);
  if (!normalized) throw new Error("Invalid phone number");

  await supabaseAdmin.from("tracked_numbers").insert({
    friendly_name,
    twilio_phone_number: normalized
  });
  revalidatePath("/tracked-numbers");
}

export async function toggleTrackedNumber(id: string, active: boolean) {
  await supabaseAdmin.from("tracked_numbers").update({ active }).eq("id", id);
  revalidatePath("/tracked-numbers");
}

export async function deleteTrackedNumber(id: string) {
  await supabaseAdmin.from("tracked_numbers").delete().eq("id", id);
  revalidatePath("/tracked-numbers");
}
