import twilio from "twilio";
import { getSupabaseAdmin } from "../../../../../lib/supabase/admin";

interface ScheduleLegRequest {
  call_id: string;
  agent_id: string;
  agent_phone: string;
  tracked_number: string;
  conference: string;
  delay_seconds: number;
  parent_call_sid: string;
}

export async function POST(request: Request) {
  // Validate internal secret to prevent unauthorized calls
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const providedSecret = request.headers.get("x-internal-secret");
  if (internalSecret && providedSecret !== internalSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: ScheduleLegRequest;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const {
    call_id,
    agent_id,
    agent_phone,
    tracked_number,
    conference,
    delay_seconds,
    parent_call_sid
  } = body;

  if (!call_id || !agent_id || !agent_phone || !tracked_number || !conference) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Wait for the specified delay
  const delayMs = Math.max(0, (delay_seconds ?? 0) * 1000);
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  // Check if call is already connected/completed/failed
  const supabaseAdmin = getSupabaseAdmin();
  const { data: callState } = await supabaseAdmin
    .from("calls")
    .select("status, connected_agent_id")
    .eq("id", call_id)
    .maybeSingle();

  if (
    callState?.status === "connected" ||
    callState?.status === "completed" ||
    callState?.status === "failed"
  ) {
    // Call already handled, skip this leg
    return new Response("Call already handled", { status: 200 });
  }

  // Create the outbound leg
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const baseUrl = process.env.TWILIO_APP_BASE_URL;

  if (!accountSid || !authToken || !baseUrl) {
    return new Response("Missing Twilio configuration", { status: 500 });
  }

  const client = twilio(accountSid, authToken);

  try {
    await client.calls.create({
      to: agent_phone,
      from: tracked_number,
      url: `${baseUrl}/api/twilio/voice/agent-bridge?conference=${encodeURIComponent(conference)}&call_id=${call_id}&agent_id=${agent_id}&delay_seconds=${delay_seconds ?? 0}`,
      statusCallback: `${baseUrl}/api/twilio/voice/status?call_id=${call_id}&agent_id=${agent_id}&parent_call_sid=${parent_call_sid}&delay_seconds=${delay_seconds ?? 0}`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      statusCallbackMethod: "POST",
      timeout: 20
    });
  } catch (e) {
    // Log error but don't fail - leg creation failures are expected for invalid numbers etc.
    console.error("Failed to create delayed leg:", e);
  }

  return new Response("OK", { status: 200 });
}
