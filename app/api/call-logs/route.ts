import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../lib/types/supabase";
import { getSupabaseEnv } from "../../../lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackedNumberId = searchParams.get("tracked_number_id") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createRouteHandlerClient<Database>({ cookies }, { supabaseUrl, supabaseKey: supabaseAnonKey });

  const {
    data: { session }
  } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!email) return new Response("Unauthorized", { status: 401 });

  const { data: admin } = await supabase.from("admins").select("id").eq("email", email).single();
  if (!admin) return new Response("Forbidden", { status: 403 });

  let query = supabase
    .from("calls")
    .select(
      "id, from_number, to_number, status, started_at, ended_at, connected_agent_id, voicemail_url, recording_url, recording_sid, recording_duration_seconds, agents:connected_agent_id(full_name), tracked_numbers:tracked_number_id(friendly_name)"
    )
    .order("started_at", { ascending: false })
    .limit(Number.isFinite(limit) ? limit : 50);

  if (trackedNumberId) query = query.eq("tracked_number_id", trackedNumberId);
  if (status) query = query.eq("status", status);

  const { data: callsData, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ calls: callsData ?? [] });
}
