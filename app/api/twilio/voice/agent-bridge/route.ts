import { NextResponse } from "next/server";
import { VoiceResponse } from "../../../../../lib/twilio";

export async function POST(request: Request) {
  const url = new URL(request.url);
  const conference = url.searchParams.get("conference") || "";

  const twiml = new VoiceResponse();
  const dial = twiml.dial({ answerOnBridge: true });
  dial.conference(
    {
      beep: "false",
      startConferenceOnEnter: true,
      endConferenceOnExit: true,
      maxParticipants: 2
    },
    conference
  );

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" }
  });
}
