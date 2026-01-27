# Call Routing Admin

Internal-only, simplified CallRail-style app built with Next.js (App Router), Supabase, and Twilio Programmable Voice. Admins can manage agents, tracked numbers, and drag-and-drop call routing. Inbound calls to tracked Twilio numbers fan out to assigned agents; first to answer connects, with logging for calls and attempts.

## Stack
- Next.js 14 + TypeScript + Tailwind (App Router)
- Supabase (Auth, Postgres, RLS)
- Twilio Programmable Voice
- dnd-kit for drag/drop

## Environment variables
Copy `.env.example` to `.env.local` and fill values:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_APP_BASE_URL=https://your-domain
```

## Database setup (Supabase)
1) Create a new Supabase project.
2) Run migration SQL in `supabase/migrations/001_init.sql` (via Supabase SQL editor or `supabase db push`).
3) Seed admin allowlist: insert your admin email into `admins` table.
4) Create a Supabase user with the same email (email/password) so you can log into the app.

## Running locally
```bash
npm install
npm run dev
```
Access `http://localhost:3000/login` and sign in with your Supabase email/password. Only emails present in `admins` table are allowed.

## Deploying
- Deploy the Next.js app to Vercel.
- Set env vars in Vercel to match `.env.example`.
- Ensure `TWILIO_APP_BASE_URL` matches the deployed domain (https).

## Twilio configuration
1) Buy/assign a Twilio phone number.
2) Point its **Voice & Fax > A Call Comes In** webhook to `POST {TWILIO_APP_BASE_URL}/api/twilio/voice/inbound`.
3) Twilio will automatically hit per-leg status callbacks and the dial action callback defined in the TwiML.
4) Keep `TWILIO_AUTH_TOKEN` in env only (never exposed to client). Webhooks validate `X-Twilio-Signature`.

## Admin UI
- Dashboard: counts + recent calls.
- Agents: CRUD + activate/deactivate. Phone numbers normalized to E.164.
- Tracked Numbers: CRUD. Click a number to open the call-flow builder.
- Call Flow Builder: drag agents into the “Ringing group”; order is persisted to `tracked_number_routes`.
- Call Logs: filter by tracked number or status; shows who answered and duration.

## API / call handling
- `/api/twilio/voice/inbound`: validates signature, finds tracked number, upserts call row, fetches assigned agents, responds with TwiML `<Dial>` containing all agent numbers (simul-ring). Dial action posts to `/api/twilio/voice/status`.
- `/api/twilio/voice/status`: validates signature; updates `calls` and `call_attempts` based on Twilio status events. First answered agent is stored as `connected_agent_id`.
- `/api/twilio/voice/recording`: Twilio RecordingStatusCallback for the call-level recording; stores recording URL/SID and duration on the call.

## Notes / future improvements
- Voicemail or fallback message when no agents answer.
- Whisper/Barge or call recording toggles.
- Business hours / holidays per tracked number.
- Round-robin or cascading steps (multiple ring groups).
- Metrics export and alerts.
