import { NextResponse } from "next/server";
import { VoiceResponse } from "../../../../../lib/twilio";

export async function POST() {
  const twiml = new VoiceResponse();

  // Silence while waiting - much better than hold music for a ringing phone experience
  // To add a real ringback tone, replace this with:
  // twiml.play({ loop: 0 }, "YOUR_RINGBACK_TONE_URL");
  twiml.pause({ length: 60 });
  twiml.pause({ length: 60 });
  twiml.pause({ length: 60 });

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}

export async function GET() {
  return POST();
}
