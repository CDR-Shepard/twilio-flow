import { NextResponse } from "next/server";
import twilio from "twilio";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";
import { VoiceResponse, validateTwilioRequest } from "../../../../../lib/twilio";

function mapAttemptStatus(status: string) {
  switch (status) {
    case "ringing":
      return "ringing";
    case "in-progress":
    case "answered":
      return "answered";
    case "no-answer":
      return "no-answer";
    case "busy":
      return "busy";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    case "completed":
      return "completed";
    default:
      return "initiated";
  }
}

function mapCallStatus(status: string) {
  switch (status) {
    case "ringing":
      return "ringing";
    case "in-progress":
    case "answered":
      return "connected";
    case "completed":
      return "completed";
    case "busy":
    case "failed":
    case "canceled":
    case "no-answer":
      return "failed";
    default:
      return "initiated";
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");
  const url = new URL(request.url);
  const pathWithQuery = `${url.pathname}${url.search}`;

  if (!validateTwilioRequest(rawBody, signature, pathWithQuery)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const callSid = params.get("CallSid") || "";
  // ParentCallSid not currently used but kept for future branching
  const callStatusRaw = params.get("CallStatus") || params.get("DialCallStatus") || "";
  const callStatus = callStatusRaw.toLowerCase();
  const callId = url.searchParams.get("call_id") || undefined;
  const agentId = url.searchParams.get("agent_id") || undefined;
  const scope = url.searchParams.get("scope") || "leg";
  const delaySeconds = Number(url.searchParams.get("delay_seconds") || "0");
  const parentCallSid = url.searchParams.get("parent_call_sid") || undefined;
  const supabaseAdmin = getSupabaseAdmin();
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  console.log(`[status] Received: callSid=${callSid}, callStatus=${callStatus}, scope=${scope}, agentId=${agentId}, callId=${callId}`);

  if (scope === "parent" && callId) {
    const status = mapCallStatus(callStatus);
    console.log(`[status] Parent scope: updating call ${callId} to status=${status}`);
    const update: { status: ReturnType<typeof mapCallStatus>; ended_at?: string } = { status };
    if (status === "completed" || status === "failed") {
      update.ended_at = new Date().toISOString();
    }
    await supabaseAdmin
      .from("calls")
      .upsert({ id: callId, twilio_call_sid: callSid, ...update }, { onConflict: "twilio_call_sid" });

    return twimlEmpty();
  }

  if (agentId && callId) {
    const attemptStatus = mapAttemptStatus(callStatus);
    console.log(`[status] Leg callback: agent=${agentId}, rawStatus=${callStatus}, mappedStatus=${attemptStatus}`);

    const { data: existing } = await supabaseAdmin
      .from("call_attempts")
      .select("id")
      .eq("attempt_call_sid", callSid)
      .maybeSingle();

    if (existing?.id) {
      await supabaseAdmin
        .from("call_attempts")
        .update({
          status: attemptStatus,
          delay_seconds: delaySeconds,
          ended_at:
            attemptStatus === "completed" || attemptStatus === "failed" || attemptStatus === "canceled"
              ? new Date().toISOString()
              : null
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("call_attempts").insert({
        call_id: callId,
        agent_id: agentId,
        attempt_call_sid: callSid,
        status: attemptStatus,
        delay_seconds: delaySeconds
      });
    }

    const { data: callRow } = await supabaseAdmin.from("calls").select("connected_agent_id").eq("id", callId).maybeSingle();

    // Ensure we capture the answering agent even if Twilio skips explicit "answered"
    if (attemptStatus === "answered" || attemptStatus === "completed") {
      console.log(`[status] Setting call ${callId} to CONNECTED because attemptStatus=${attemptStatus} (raw: ${callStatus})`);
      await supabaseAdmin
        .from("calls")
        .update({ status: "connected", connected_agent_id: agentId })
        .eq("id", callId);

      // Remove other ringing participants in the conference
      if (accountSid && authToken) {
        const client = twilio(accountSid, authToken);
        const conferenceName = `cf-${callId}`;
        try {
          const conferences = await client.conferences.list({
            friendlyName: conferenceName,
            status: "in-progress",
            limit: 1
          });
          if (conferences.length) {
            const confSid = conferences[0].sid;
            const participants = await client.conferences(confSid).participants.list();
            await Promise.all(
              participants
                .filter((p) => p.callSid !== callSid && (!parentCallSid || p.callSid !== parentCallSid))
                .map((p) => client.conferences(confSid).participants(p.callSid).remove())
            );
          }
        } catch (e) {
          // ignore; remaining legs will time out
        }
      }
    }

    // Only mark the call complete when the connected agent's leg ends
    if (
      attemptStatus === "completed" &&
      callRow?.connected_agent_id &&
      callRow.connected_agent_id === agentId
    ) {
      await supabaseAdmin
        .from("calls")
        .update({ ended_at: new Date().toISOString(), status: "completed" })
        .eq("id", callId);
    }
  }

  return twimlEmpty();
}

function twimlEmpty() {
  const vr = new VoiceResponse();
  return new NextResponse(vr.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
