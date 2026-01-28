import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../lib/types/supabase";
import { getSupabaseEnv } from "../../../../lib/env";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createRouteHandlerClient<Database>({ cookies }, { supabaseUrl, supabaseKey: supabaseAnonKey });

  const {
    data: { session }
  } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!email) return new Response("Unauthorized", { status: 401 });
  const { data: admin } = await supabase.from("admins").select("id").eq("email", email).single();
  if (!admin) return new Response("Forbidden", { status: 403 });

  const { data, error } = await supabase
    .from("calls")
    .select(
      "id, status, started_at, ended_at, from_number, to_number, voicemail_url, recording_url, recording_sid, recording_duration_seconds, connected_agent_id, tracked_numbers:tracked_number_id(friendly_name, twilio_phone_number), agents:connected_agent_id(full_name), call_attempts:call_attempts(status, agent_id, started_at, ended_at)"
    )
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return new Response("Not found", { status: 404 });

  return NextResponse.json({ call: data });
}
