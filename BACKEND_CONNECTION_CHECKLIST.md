# Backend connection checklist — for the later activation pass

The complete frontend is implemented. The existing backend code and API contracts
are preserved. This file records what is needed to activate live services later;
no service configuration, database migration, account or credential was changed
as part of the redesign. Do not paste secret values into chat or commit them.
Use secure environment settings (or an existing ignored local environment file).

## Values to provide

| Name | Required for | Handling |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Existing browser and server Supabase clients | Actual project HTTPS URL; public build setting |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Email/password authentication and browser sessions | Actual publishable key; intentionally browser-visible |
| `SUPABASE_SECRET_KEY` | Server-side session verification, feedback/history database operations | Server-only secret; never expose as `NEXT_PUBLIC_*` |
| `GROQ_API_KEY` | Nova scoring, interview questions/review, EC rankings and summaries | Server-only secret for the existing Groq account |

The public Supabase values must be present when building the frontend. Restart
local development or rebuild production after changing them. The synthetic
`accepted-test.supabase.co` values in browser-test instructions are fixtures and
must not be used for deployment.

## Existing project prerequisites to confirm

- Identify the intended Supabase project; reuse it instead of creating another.
- Confirm migrations `supabase/migrations/001_init.sql` through `004_server_only_inserts.sql`
  have been applied in order. Applying migrations is a later, authorized action.
- Enable Supabase email/password sign-in. Decide whether email confirmation is
  required, and configure the actual application origins for confirmation and
  password-reset redirects. Production email delivery may need the project's SMTP
  settings. Do not weaken existing authorization or Row Level Security.
- Confirm the deployment's server runtime receives the two server-only keys.
- Allow the exact Supabase project hostname and `api.groq.com` in the execution
  environment's network policy when running live integration checks.
- Preserve the existing primary/fallback Groq models, schemas, prompts and quotas.
  `GROQ_MODEL`, `GROQ_FALLBACK_MODEL` and `GROQ_DAILY_CAP` already have repository
  defaults; no override is required to connect the frontend.

## Live checks to run after configuration is supplied

1. Sign up with an authorized test account; check the configured confirmation
   path, sign in, restore a session after reload, reset a password, and sign out.
2. Confirm private tools remain gated while signed out and APIs reject missing
   or expired authorization. Existing backend access rules must stay intact.
3. Submit one representative written response through `POST /api/jobs`. Verify
   Nova's score, feedback and rewrite are saved to the signed-in user's history.
   Use an explicitly authorized provider test budget; do not run repeated AI calls
   unnecessarily.
4. Confirm `GET /api/jobs/[id]` can recover an unfinished evaluation and the UI
   correctly presents quota/error responses. Do not increase limits to pass a test.
5. Exercise interview start/review through `/api/interview`, activity evaluation
   through `/api/ec`, history retrieval through `/api/analytics`, and one Nova
   breakdown through `/api/summary`, within the agreed test budget.
6. Confirm Planner and EC drafts still use their existing localStorage keys,
   historical admission data loads, and anonymous analytics events remain intact.
7. Test browser speech recognition with explicit microphone permission on a
   supported browser/device. Audio is not uploaded to Accepted; typed input stays
   available. Browser speech services have their own connectivity requirements.
8. Run the normal production build with the actual deployment settings, then
   recheck the public and signed-in UI. Never publish the synthetic test build.

## Optional later setup

`CRON_SECRET` and a scheduler for `POST /api/jobs/drain` are optional recovery
infrastructure. They are not needed for normal same-request written scoring.
Do not enable a scheduler, create credentials or change production configuration
without the corresponding later authorization.

## What is verified now

Local planning, search/filtering, historical-data presentation, responsive layout,
keyboard/modal behavior, UI validation and state transitions are exercised in
real-browser regression tests. Auth and API responses are controlled fixtures in
those tests, so no live Supabase/Groq success or provider usage is claimed. All
screens, forms, loading/error states and result presentations are present; the
remaining work in this checklist is connecting and validating live services.
