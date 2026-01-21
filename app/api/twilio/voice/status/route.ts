import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase/admin";
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
  const parentCallSid = params.get("ParentCallSid") || "";
  const callStatusRaw = params.get("CallStatus") || params.get("DialCallStatus") || "";
  const callStatus = callStatusRaw.toLowerCase();
  const callId = url.searchParams.get("call_id") || undefined;
  const agentId = url.searchParams.get("agent_id") || undefined;
  const scope = url.searchParams.get("scope") || "leg";

  if (scope === "parent" && callId) {
    const status = mapCallStatus(callStatus);
    const update: any = { status };
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
        status: attemptStatus
      });
    }

    if (attemptStatus === "answered") {
      await supabaseAdmin
        .from("calls")
        .update({ status: "connected", connected_agent_id: agentId })
        .eq("id", callId);
    }

    if (attemptStatus === "completed" || attemptStatus === "failed" || attemptStatus === "canceled") {
      await supabaseAdmin
        .from("calls")
        .update({ ended_at: new Date().toISOString(), status: mapCallStatus(callStatus) })
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
