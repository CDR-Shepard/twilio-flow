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
  const callSid = params.get("CallSid");
  const durationRaw = params.get("RecordingDuration");

  if (callSid && recordingUrl) {
    const durationSeconds = durationRaw ? Number.parseInt(durationRaw, 10) : null;
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from("calls")
      .update({
        recording_url: recordingUrl,
        recording_sid: recordingSid ?? null,
        recording_duration_seconds: Number.isFinite(durationSeconds) ? durationSeconds : null
      })
      .eq("twilio_call_sid", callSid);
  }

  const vr = new VoiceResponse();
  return new NextResponse(vr.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
