import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import twilio from "twilio";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";
import { VoiceResponse, validateTwilioRequest } from "../../../../../lib/twilio";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");
  const url = new URL(request.url);
  const pathWithQuery = `${url.pathname}${url.search}`;
  const groupIndex = Number(url.searchParams.get("group") || "0");

  if (groupIndex === 0 && !validateTwilioRequest(rawBody, signature, pathWithQuery)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const toNumber = (params.get("To") || "").trim();
  const fromNumber = (params.get("From") || "").trim();
  const callSid = params.get("CallSid") || "";
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
      .select("delay_seconds, sort_order, active, agents(id, full_name, phone_number, active)")
      .eq("call_flow_id", trackedNumber.call_flow_id)
      .order("delay_seconds", { ascending: true })
      .order("sort_order", { ascending: true });
    const rows =
      (flowRows as { delay_seconds: number; sort_order: number; active?: boolean | null; agents: { id: string; full_name: string; phone_number: string; active: boolean } | null }[] | null) ??
      [];
    activeAgents = rows
      .map((r) => ({
        id: r.agents?.id ?? "",
        full_name: r.agents?.full_name ?? "",
        phone_number: r.agents?.phone_number ?? "",
        active: (r.active ?? true) && (r.agents?.active ?? false),
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
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken || !baseUrl) {
    twiml.say("Configuration error. Please contact support.");
    return twimlResponse(twiml);
  }
  const client = twilio(accountSid, authToken);

  // Fan-out conference model with per-agent delays
  const conferenceName = `cf-${callId}`;

  // Schedule outbound legs: immediate legs are created synchronously,
  // delayed legs are scheduled via fire-and-forget to a separate endpoint.
  for (const agent of activeAgents) {
    const delaySeconds = agent.delay_seconds ?? 0;

    if (delaySeconds === 0) {
      // Create immediate legs synchronously before returning TwiML
      try {
        await client.calls.create({
          to: agent.phone_number,
          from: trackedNumber.twilio_phone_number,
          url: `${baseUrl}/api/twilio/voice/agent-bridge?conference=${encodeURIComponent(conferenceName)}&call_id=${callId}&agent_id=${agent.id}&delay_seconds=0`,
          statusCallback: `${baseUrl}/api/twilio/voice/status?call_id=${callId}&agent_id=${agent.id}&parent_call_sid=${callSid}&delay_seconds=0`,
          statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
          statusCallbackMethod: "POST",
          timeout: 20
        });
      } catch (e) {
        // ignore; Twilio logs will show if failures occur
      }
    } else {
      // Schedule delayed legs using waitUntil to run after response is sent
      const agentCopy = { ...agent };
      waitUntil(
        (async () => {
          // Wait for the delay
          await new Promise((resolve) => setTimeout(resolve, delaySeconds * 1000));

          // Check if call is already connected/completed/failed
          const { data: callState } = await supabaseAdmin
            .from("calls")
            .select("status, connected_agent_id")
            .eq("id", callId as string)
            .maybeSingle();

          if (
            callState?.status === "connected" ||
            callState?.status === "completed" ||
            callState?.status === "failed"
          ) {
            return; // Call already handled, skip this leg
          }

          // Create the delayed leg
          await client.calls.create({
            to: agentCopy.phone_number,
            from: trackedNumber.twilio_phone_number,
            url: `${baseUrl}/api/twilio/voice/agent-bridge?conference=${encodeURIComponent(conferenceName)}&call_id=${callId}&agent_id=${agentCopy.id}&delay_seconds=${delaySeconds}`,
            statusCallback: `${baseUrl}/api/twilio/voice/status?call_id=${callId}&agent_id=${agentCopy.id}&parent_call_sid=${callSid}&delay_seconds=${delaySeconds}`,
            statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
            statusCallbackMethod: "POST",
            timeout: 20
          });
        })().catch((e) => {
          console.error("Failed to create delayed leg:", e);
        })
      );
    }
  }

  if (groupIndex === 0 && trackedNumber.greeting_text) {
    twiml.say({ voice: "Polly.Joanna" }, trackedNumber.greeting_text);
  }

  const dial = twiml.dial({
    answerOnBridge: true,
    callerId: trackedNumber.twilio_phone_number,
    record: "record-from-answer-dual",
    recordingStatusCallback: `${baseUrl}/api/twilio/voice/recording`,
    recordingStatusCallbackEvent: ["completed"],
    recordingStatusCallbackMethod: "POST"
  });
  dial.conference(
    {
      beep: "false",
      startConferenceOnEnter: true,
      endConferenceOnExit: false,
      maxParticipants: 10,
      waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient"
    },
    conferenceName
  );

  return twimlResponse(twiml);
}

function twimlResponse(response: { toString(): string }) {
  return new NextResponse(response.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
