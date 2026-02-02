import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";
import { VoiceResponse, validateTwilioRequest } from "../../../../../lib/twilio";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");
  const url = new URL(request.url);
  const pathWithQuery = `${url.pathname}${url.search}`;

  if (!validateTwilioRequest(rawBody, signature, pathWithQuery)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const toNumber = (params.get("To") || "").trim();
  const fromNumber = (params.get("From") || "").trim();
  const callSid = params.get("CallSid") || "";
  const groupIndex = Number(url.searchParams.get("group") || "0");
  const callIdParam = url.searchParams.get("call_id");

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

  let callId = callIdParam ?? existingCall?.id;

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

  // Resolve routing: prefer call flow if assigned, fallback to per-number routes
  let activeAgents: { id: string; full_name: string; phone_number: string; active: boolean; delay_seconds: number }[] =
    [];
  const loadRoutes = async () => {
    const { data: routesData } = await supabaseAdmin
      .from("tracked_number_routes")
      .select("agent_id, agents(full_name, phone_number, active)")
      .eq("tracked_number_id", trackedNumber.id)
      .eq("active", true)
      .order("sort_order", { ascending: true });
    type AgentEntry = { full_name?: string | null; phone_number?: string | null; active?: boolean | null };
    type RouteRow = { agent_id: string; agents?: AgentEntry | AgentEntry[] | null };
    const routesRaw: RouteRow[] = (routesData as RouteRow[] | null) ?? [];
    return routesRaw
      .map((r) => {
        const agentEntry = Array.isArray(r.agents) ? r.agents[0] : r.agents;
        return {
          id: r.agent_id as string,
          full_name: agentEntry?.full_name ?? "",
          phone_number: agentEntry?.phone_number ?? "",
          active: agentEntry?.active ?? false,
          delay_seconds: 0
        };
      })
      .filter((a) => a.active);
  };

  if (trackedNumber.call_flow_id) {
    const { data: flowRows } = await supabaseAdmin
      .from("call_flow_members")
      .select("delay_seconds, sort_order, agents(id, full_name, phone_number, active)")
      .eq("call_flow_id", trackedNumber.call_flow_id)
      .eq("active", true)
      .order("delay_seconds", { ascending: true })
      .order("sort_order", { ascending: true });
    const rows =
      (flowRows as { delay_seconds: number; sort_order: number; agents: { id: string; full_name: string; phone_number: string; active: boolean } | null }[] | null) ??
      [];
    activeAgents = rows
      .map((r) => ({
        id: r.agents?.id ?? "",
        full_name: r.agents?.full_name ?? "",
        phone_number: r.agents?.phone_number ?? "",
        active: r.agents?.active ?? false,
        delay_seconds: r.delay_seconds ?? 0
      }))
      .filter((a) => a.id && a.active);
    // Fallback to legacy per-number routes if flow has no active members
    if (activeAgents.length === 0) {
      activeAgents = await loadRoutes();
    }
  } else {
    activeAgents = await loadRoutes();
  }

  if (activeAgents.length === 0) {
    twiml.say("No agents are assigned to this number.");
    return twimlResponse(twiml);
  }

  const baseUrl = process.env.TWILIO_APP_BASE_URL;

  const groups = Object.entries(
    activeAgents.reduce<Record<number, typeof activeAgents>>((acc, agent) => {
      const bucket = agent.delay_seconds || 0;
      if (!acc[bucket]) acc[bucket] = [];
      acc[bucket].push(agent);
      return acc;
    }, {})
  )
    .map(([delay, members]) => ({
      delay: Number(delay),
      members: members.sort((a, b) => a.full_name.localeCompare(b.full_name))
    }))
    .sort((a, b) => a.delay - b.delay);

  if (groupIndex >= groups.length) {
    if (trackedNumber.voicemail_enabled) {
      twiml.say(trackedNumber.voicemail_prompt || "Please leave a message after the tone.");
      twiml.record({
        action: `${baseUrl}/api/twilio/voice/voicemail?call_id=${callId}`,
        method: "POST",
        maxLength: 120,
        playBeep: true
      });
    } else {
      twiml.hangup();
    }
    return twimlResponse(twiml);
  }

  const currentGroup = groups[groupIndex];
  const nextGroupIndex = groupIndex + 1;

  if (groupIndex === 0 && trackedNumber.greeting_text) {
    twiml.say({ voice: "Polly.Joanna" }, trackedNumber.greeting_text);
  }

  const waitSeconds =
    groupIndex === 0 ? 0 : Math.max(0, currentGroup.delay - groups[groupIndex - 1].delay);
  if (waitSeconds > 0) {
    twiml.pause({ length: waitSeconds });
  }

  const dial = twiml.dial({
    answerOnBridge: true,
    timeout: 18, // allow enough time before moving to next wave
    callerId: trackedNumber.twilio_phone_number, // mask caller ID to agents
    action: `${baseUrl}/api/twilio/voice/inbound/route?call_id=${callId}&group=${nextGroupIndex}`,
    method: "POST",
    record: "record-from-answer-dual",
    recordingStatusCallback: `${baseUrl}/api/twilio/voice/recording`,
    recordingStatusCallbackEvent: ["completed"],
    recordingStatusCallbackMethod: "POST"
  });

  for (const agent of currentGroup.members) {
    dial.number(
      {
        statusCallback: `${baseUrl}/api/twilio/voice/status?call_id=${callId}&agent_id=${agent.id}&delay_seconds=${agent.delay_seconds ?? 0}`,
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
