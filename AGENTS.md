# Repository Guidelines

## Project Structure & Module Organization
- `app/` — Next.js routes; `(app)` holds authenticated UI, `(v2)` covers console/live views, `api/` contains route handlers (Twilio voice, analytics, auth).
- `components/` — shared UI pieces and chart primitives used by `/console` and `/call-logs`.
- `lib/` — Supabase helpers, auth/session utilities, Twilio client/TwiML helpers, analytics logic.
- `supabase/` — SQL migrations; run in order (e.g., `004_call_flows.sql` enables per-agent delays).
- Styling config in `tailwind.config.ts` and `app/globals.css`; assets under `public/`.

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js dev server.
- `npm run build` — type-check, lint, and emit the production build (CI uses this).
- `npm run start` — serve the built app locally.
- `npm run lint` — ESLint with project rules; run before committing UI-heavy changes.

## Coding Style & Naming Conventions
- TypeScript-first; add explicit return types on exported functions/handlers.
- Keep imports absolute from project root (`@/lib/...`, `@/components/...`) or short relative within a feature folder.
- Use Tailwind utilities with semantic groupings; prefer design tokens from the `brand`/`accent` palette.
- Components: name `PascalCase`; files co-located with route or feature when small, otherwise move to `components/`.
- Avoid silent `any`; narrow Twilio/Supabase payload types where practical.

## Testing Guidelines
- No formal test suite today; minimum bar is `npm run build` before pushing to catch type/lint issues.
- If adding tests, colocate as `*.test.ts` / `*.spec.ts` near the code under test and keep fixtures small.
- For Twilio flows, use Twilio console webhooks against `/api/twilio/voice/*` in a staging project before production flips.

## Commit & Pull Request Guidelines
- Commit messages: short, imperative, scoped (e.g., `feat: conference fan-out delays`, `fix: agent share math`, `chore: bump twilio sdk`).
- Group related changes; avoid drive-by refactors in the same commit.
- PRs should include: what changed, why, how to verify (commands or call flow steps), and screenshots/recordings for UI adjustments.

## Security & Configuration Tips
- Secrets live in `.env.local` (gitignored). Required: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_APP_BASE_URL`, Supabase service/anon keys.
- Verify migrations are applied (`supabase/`); delayed call flows rely on `call_flow_members.delay_seconds`.
- Never log auth tokens or caller PII; prefer masked logging in API routes.

## Architecture Notes
- Inbound voice (`app/api/twilio/voice/inbound`) fans out to agents via outbound API legs with per-agent delays, bridging everyone into a Twilio conference; `status` webhook prunes remaining legs when someone answers.
- Analytics endpoints under `app/api/analytics/*`; charts share renderers in `components/agent-answer-share-chart.tsx` and related files.
