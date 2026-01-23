import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";
import { validateTwilioRequest, VoiceResponse } from "../../../../../lib/twilio";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-twilio-signature");
  const url = new URL(request.url);
  const pathWithQuery = `${url.pathname}${url.search}`;

  if (!validateTwilioRequest(rawBody, signature, pathWithQuery)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const recordingUrl = params.get("RecordingUrl");
  const recordingSid = params.get("RecordingSid");
  const callId = url.searchParams.get("call_id");

  if (callId && recordingUrl) {
    const supabase = getSupabaseAdmin();
    await supabase
      .from("calls")
      .update({
        voicemail_url: recordingUrl,
        voicemail_sid: recordingSid ?? null,
        status: "completed",
        ended_at: new Date().toISOString()
      })
      .eq("id", callId);
  }

  const vr = new VoiceResponse();
  vr.say("Thanks, goodbye.");
  vr.hangup();

  return new NextResponse(vr.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
