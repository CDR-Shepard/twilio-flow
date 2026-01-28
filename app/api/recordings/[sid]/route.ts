import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "../../../../lib/types/supabase";
import { getSupabaseEnv } from "../../../../lib/env";

export async function GET(_request: Request, { params }: { params: { sid?: string } }) {
  const recordingSid = params.sid;
  if (!recordingSid) return new Response("Missing recording SID", { status: 400 });

  // Auth: must be signed-in admin
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();
  const supabase = createRouteHandlerClient<Database>(
    { cookies },
    { supabaseUrl, supabaseKey: supabaseAnonKey }
  );

  const {
    data: { session }
  } = await supabase.auth.getSession();
  const email = session?.user?.email;
  if (!email) return new Response("Unauthorized", { status: 401 });

  const { data: admin } = await supabase.from("admins").select("id").eq("email", email).single();
  if (!admin) return new Response("Forbidden", { status: 403 });

  // Fetch recording from Twilio and proxy to the client
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    return new Response("Twilio credentials not configured", { status: 500 });
  }

  const mediaUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const twilioResp = await fetch(mediaUrl, {
    headers: { Authorization: `Basic ${authHeader}` }
  });

  if (!twilioResp.ok || !twilioResp.body) {
    return new Response("Recording not found", { status: twilioResp.status });
  }

  return new NextResponse(twilioResp.body, {
    status: 200,
    headers: {
      "Content-Type": twilioResp.headers.get("content-type") || "audio/mpeg",
      "Cache-Control": "private, max-age=60"
    }
  });
}
