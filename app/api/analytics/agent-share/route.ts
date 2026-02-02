import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase/admin";

function rangeToWindow(range: string) {
  const now = new Date();
  switch (range) {
    case "1h":
      return { since: new Date(now.getTime() - 60 * 60 * 1000), bucket: "minute" };
    case "24h":
    case "1d":
      return { since: new Date(now.getTime() - 24 * 60 * 60 * 1000), bucket: "hour" };
    case "7d":
      return { since: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), bucket: "day" };
    case "30d":
    default:
      return { since: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), bucket: "day" };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trackingNumberId = url.searchParams.get("tracking_number_id");
  const range = url.searchParams.get("range") ?? "7d";
  const { since, bucket } = rangeToWindow(range);

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.rpc("agent_answer_share", {
    _tracking_number_id: trackingNumberId || null,
    _since: since.toISOString(),
    _bucket: bucket
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const agentIds = Array.from(new Set(rows.map((r: { agent_id: string | null }) => r.agent_id).filter(Boolean)));
  let agents: Record<string, { full_name: string | null }> = {};
  if (agentIds.length) {
    const { data: agentData } = await supabaseAdmin.from("agents").select("id, full_name").in("id", agentIds);
    agents = Object.fromEntries((agentData ?? []).map((a: { id: string; full_name: string | null }) => [a.id, { full_name: a.full_name }]));
  }

  return NextResponse.json({ range, bucket, data: rows, agents });
}
