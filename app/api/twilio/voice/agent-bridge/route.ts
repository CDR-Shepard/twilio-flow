import { NextResponse } from "next/server";
import { VoiceResponse } from "../../../../../lib/twilio";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const conference = url.searchParams.get("conference") || "";
  const callId = url.searchParams.get("call_id") || "";
  const agentId = url.searchParams.get("agent_id") || "";
  const delaySeconds = url.searchParams.get("delay_seconds") || "0";
  const accepted = url.searchParams.get("accepted") || "";

  // Parse the body to check for DTMF digits
  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);
  const digits = params.get("Digits") || "";

  const twiml = new VoiceResponse();
  const baseUrl = process.env.TWILIO_APP_BASE_URL;

  // If already accepted (pressed 1), connect to conference
  if (accepted === "1" || digits === "1") {
    console.log(`[agent-bridge] Agent ${agentId} accepted call, connecting to conference ${conference}`);

    // Update call status to connected now that agent has confirmed
    if (callId && agentId) {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin
        .from("calls")
        .update({ status: "connected", connected_agent_id: agentId })
        .eq("id", callId);
      console.log(`[agent-bridge] Set call ${callId} to connected with agent ${agentId}`);
    }
    const dial = twiml.dial({ answerOnBridge: true });
    dial.conference(
      {
        beep: "false",
        startConferenceOnEnter: true,
        endConferenceOnExit: false,
        maxParticipants: 10,
        waitUrl: "http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient"
      },
      conference
    );
    return twimlResponse(twiml);
  }

  // If digits were pressed but not "1", reject
  if (digits && digits !== "1") {
    console.log(`[agent-bridge] Agent ${agentId} pressed wrong key: ${digits}`);
    twiml.say("Invalid input. Goodbye.");
    twiml.hangup();
    return twimlResponse(twiml);
  }

  // Initial prompt: ask agent to press 1 to accept
  console.log(`[agent-bridge] Prompting agent ${agentId} to press 1 to accept`);
  const gather = twiml.gather({
    numDigits: 1,
    timeout: 10,
    action: `${baseUrl}/api/twilio/voice/agent-bridge?conference=${encodeURIComponent(conference)}&call_id=${callId}&agent_id=${agentId}&delay_seconds=${delaySeconds}`,
    method: "POST"
  });
  gather.say({ voice: "Polly.Joanna" }, "Incoming call. Press 1 to accept.");

  // If no input, hang up (voicemail won't press anything)
  twiml.say("No response received. Goodbye.");
  twiml.hangup();

  return twimlResponse(twiml);
}

function twimlResponse(response: { toString(): string }) {
  return new NextResponse(response.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
