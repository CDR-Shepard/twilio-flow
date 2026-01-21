import twilio, { twiml } from "twilio";

export const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export const VoiceResponse = twiml.VoiceResponse;

export function validateTwilioRequest(rawBody: string, headerSignature: string | null, path: string) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const baseUrl = process.env.TWILIO_APP_BASE_URL;
  if (!authToken || !baseUrl) return false;

  const expectedUrl = `${baseUrl}${path}`;
  const params = Object.fromEntries(new URLSearchParams(rawBody));
  return twilio.validateRequest(authToken, headerSignature ?? "", expectedUrl, params);
}
