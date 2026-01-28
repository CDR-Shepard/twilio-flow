import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../lib/types/supabase";
import { getSupabaseEnv } from "../../../lib/env";
import { loadMetrics } from "../../../lib/metrics";

export async function GET(request: Request) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createRouteHandlerClient<Database>({ cookies }, { supabaseUrl, supabaseKey: supabaseAnonKey });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const tracked_number_id = searchParams.get("tracked_number_id") ?? undefined;
  const agent_id = searchParams.get("agent_id") ?? undefined;

  const {
    data: { session }
  } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!email) return new Response("Unauthorized", { status: 401 });

  const { data: admin } = await supabase.from("admins").select("id").eq("email", email).single();
  if (!admin) return new Response("Forbidden", { status: 403 });

  try {
    const metrics = await loadMetrics(supabase, { from, to, tracked_number_id, agent_id });
    return NextResponse.json(metrics);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load metrics";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
