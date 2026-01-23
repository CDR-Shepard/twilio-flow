import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  await supabase.from("agents").delete().eq("id", params.id);
  return NextResponse.json({ ok: true });
}
