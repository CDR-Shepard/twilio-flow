# Repository Guidelines

## Project Structure & Module Organization
- `app/` – Next.js app routes (`(app)` for authenticated UI, `(v2)` for console/live pages, API route handlers under `api/`).
- `components/` – shared UI and chart components.
- `lib/` – helpers (Supabase client, auth, metrics, Twilio helpers).
- `supabase/` – SQL migrations.
- `tailwind.config.ts`, `globals.css` – styling configuration.

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js dev server.
- `npm run build` — type-check, lint, and produce production build (used in CI).
- `npm run start` — serve the production build locally.
- `npm run lint` — run ESLint.

## Coding Style & Naming Conventions
- TypeScript throughout; prefer explicit types on exported functions.
- Follow existing folder naming: feature pages under `app/(app)/...`, shared bits in `components/`.
- Use Tailwind for styling; prefer semantic utility groupings and design tokens from `brand`/`accent` palette.
- Keep imports absolute from project root (as seen) or relative within feature folders; avoid deep relative chains.

## Testing Guidelines
- No formal test suite is present; run `npm run build` before pushing to catch lint/type issues.
- When adding tests, colocate near features and name `*.test.ts` or `*.spec.ts`.

## Commit & Pull Request Guidelines
- Commit style: short, imperative, scoped (e.g., `fix: normalize agent share` / `feat: conference fan-out` / `chore: raise call log limits`).
- Group related changes; avoid large unrelated diffs.
- PRs should describe behavior, include steps to verify (e.g., `npm run build`), and screenshots for UI changes when possible.

## Security & Configuration Tips
- Required env vars for voice flows: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_APP_BASE_URL`, Supabase keys (see `getSupabaseEnv`).
- Never commit secrets; use `.env.local` (gitignored).
- For delayed call flows to work, migration `004_call_flows.sql` must be applied and `call_flow_members.delay_seconds` set.

## Architecture Notes
- Voice routing is handled under `app/api/twilio/voice/*`; inbound calls now use a conference fan-out to honor per-agent delays.
- Analytics endpoints live in `app/api/analytics/*`; dashboards use Recharts components in `components/`.
