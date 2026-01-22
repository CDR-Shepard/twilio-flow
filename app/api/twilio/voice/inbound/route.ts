import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";
import { VoiceResponse, validateTwilioRequest } from "../../../../../lib/twilio";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");
  const pathWithQuery = new URL(request.url).pathname; // inbound has no query string

  if (!validateTwilioRequest(rawBody, signature, pathWithQuery)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const toNumber = (params.get("To") || "").trim();
  const fromNumber = (params.get("From") || "").trim();
  const callSid = params.get("CallSid") || "";

  const twiml = new VoiceResponse();

  const supabaseAdmin = getSupabaseAdmin();
  const { data: trackedNumber } = await supabaseAdmin
    .from("tracked_numbers")
    .select("*")
    .eq("twilio_phone_number", toNumber)
    .eq("active", true)
    .single();

  if (!trackedNumber) {
    twiml.say("Sorry, this number is not configured.");
    return twimlResponse(twiml);
  }

  const { data: existingCall } = await supabaseAdmin
    .from("calls")
    .select("id")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  let callId = existingCall?.id;

  if (!callId) {
    const { data: inserted } = await supabaseAdmin
      .from("calls")
      .insert({
        tracked_number_id: trackedNumber.id,
        twilio_call_sid: callSid,
        from_number: fromNumber,
        to_number: toNumber,
        status: "ringing"
      })
      .select("id")
      .single();
    callId = inserted?.id;
  } else {
    await supabaseAdmin.from("calls").update({ status: "ringing" }).eq("id", callId);
  }

  const { data: routesData } = await supabaseAdmin
    .from("tracked_number_routes")
    .select("agent_id, agents(full_name, phone_number, active)")
    .eq("tracked_number_id", trackedNumber.id)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  type AgentEntry = { full_name?: string | null; phone_number?: string | null; active?: boolean | null };
  type RouteRow = { agent_id: string; agents?: AgentEntry | AgentEntry[] | null };
  const routesRaw: RouteRow[] = (routesData as RouteRow[] | null) ?? [];
  const activeAgents = routesRaw
    .map((r) => {
      const agentEntry = Array.isArray(r.agents) ? r.agents[0] : r.agents;
      return {
        id: r.agent_id as string,
        full_name: agentEntry?.full_name ?? "",
        phone_number: agentEntry?.phone_number ?? "",
        active: agentEntry?.active ?? false
      };
    })
    .filter((a) => a.active);

  if (activeAgents.length === 0) {
    twiml.say("No agents are assigned to this number.");
    return twimlResponse(twiml);
  }

  const baseUrl = process.env.TWILIO_APP_BASE_URL;
  const dial = twiml.dial({
    answerOnBridge: true,
    timeout: 25,
    action: `${baseUrl}/api/twilio/voice/status?call_id=${callId}&scope=parent`,
    method: "POST"
  });

  for (const agent of activeAgents) {
    dial.number(
      {
        statusCallback: `${baseUrl}/api/twilio/voice/status?call_id=${callId}&agent_id=${agent.id}`,
        statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
        statusCallbackMethod: "POST"
      },
      agent.phone_number
    );
  }

  return twimlResponse(twiml);
}

function twimlResponse(response: { toString(): string }) {
  return new NextResponse(response.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
