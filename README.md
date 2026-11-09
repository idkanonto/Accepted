# Accepted! — Ontario Supp App Hub

A responsive web app that helps Ontario Grade 12 students plan applications and
practise representative supplemental prompts under realistic timers, with direct
feedback from **Nova**, a Groq-powered admissions evaluator. Practice prompts and
competitive ranges are planning references, not official or guaranteed data.

Stack: **Next.js 15 (Vercel) · Supabase (auth + database) · Groq (AI scoring)**.

## Features

- **Supp App Simulator** — pick a program and format, then practice under strict
  prep/response timers (video-response practice: 30s prep / 2 min; written: 60s
  prep / 10 min). Written answers are scored in the same request, usually in a
  couple of seconds.
- **Program Vault** — browse Ontario programs with supplemental-application
  references, competitive averages, formats, deadlines, search, and one-click practice.
- **OUAC & Chance Planner** — keep a private program shortlist, application
  checklist, broad academic-alignment view, and a **Historical averages** tab
  built from the Accepted! outcome spreadsheets.
- **Voice mock interviews** — read on-screen practice questions, transcribe
  answers with browser speech recognition (microphone permission is requested
  explicitly), and receive a structured review of the submitted transcript.
  Microphone audio is not uploaded to Accepted.
- **Nova AI scoring** — written answers are scored 0–100 with a verdict, strengths,
  fixes, and a model rewrite. Answers are limited to 500 words.
- **Nova Analytics** — attempts are saved to your account: scores by program, an
  8-week trend, recent attempts, and an AI breakdown of where to focus next.
- **EC Rater** — rank up to 8 activities, get advice on making each one count, and
  see how your ECs fit each program in the Planner and Programs.
- **Program markers** — grade-range bars with your average, plus Long answer and
  Background & ECs tags (derived from each program's listed requirements).
- **Sign in** — email/password, powered by Supabase Auth.
- **Analytics** — Vercel Analytics + Speed Insights: page views, web vitals, and custom
  funnel events with an anonymous per-student visitor id.

## How scoring stays fast

Scoring runs server-side in the same request that submits the answer:

1. The browser POSTs the answer with its Supabase access token.
2. `/api/jobs` checks the per-student daily quota and the global daily cap,
   inserts a `feedback_jobs` row, and calls Groq once.
3. The result is written back with `complete_feedback_job` and returned
   immediately — no queue, no polling, no 30-second timeout.

`lib/ai.ts` uses the Groq OpenAI-compatible endpoint with
`reasoning_effort: low`, which returns the structured evaluation in about a
second. A fallback model is tried if the primary fails.

The queue drain (`lib/queue.ts`, `POST /api/jobs/drain`) remains for recovery of
jobs that were claimed when a serverless function died, and can be driven by a
scheduler.

## Limits

- **Per student:** 10 evaluations/day (derived as `GROQ_DAILY_CAP / 25`, floored
  at 8). Reaching it returns a clear "come back tomorrow" message.
- **Global:** `GROQ_DAILY_CAP` evaluations/day across all students (default 250).
- **Answers:** 20–4,000 characters and at most 500 words, enforced in the browser
  and on the server.
- **Summaries, interviews and EC ratings:** 20/hour per student.

## Setup

### 1. Supabase — create the schema

Dashboard → **SQL Editor** → run the SQL files in `supabase/migrations` in
numeric order. Existing installations should run migrations `002`, `003` and
`004`: `002` restricts public access to privileged queue functions, `003`
recovers jobs when a background worker times out, and `004` makes job creation
server-only.

This creates `feedback_jobs`, `daily_usage`, `summary_usage`, Row Level Security
policies, and the queue functions. Nothing else is required — Supabase Auth is
built in.

### 2. Supabase — email auth settings

Dashboard → **Authentication** → **Sign In / Providers** → **Email**. Enable email
sign-in and choose whether to require email confirmation. For production, configure
your own SMTP provider so confirmation and password-reset messages are delivered
reliably.

Under **Authentication → URL Configuration**, set the production Site URL and
allow the exact local and deployed app origins used for email confirmation and
password resets (for example `http://localhost:3000/**` and
`https://your-domain.example/**`).

### 3. Local environment

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | `https://<project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `.env.local` | `sb_publishable_…` — safe in the browser |
| `SUPABASE_SECRET_KEY` | `.env.local` | `sb_secret_…` — **server-only, never commit** |
| `GROQ_API_KEY` | `.env.local` | Server-only. |
| `GROQ_MODEL` | `.env.local` | Default `openai/gpt-oss-120b`. |
| `GROQ_FALLBACK_MODEL` | `.env.local` | Default `openai/gpt-oss-20b`. |
| `GROQ_DAILY_CAP` | `.env.local` | Default `250`. |
| `CRON_SECRET` | optional | Random string for `/api/jobs/drain`. |

### 4. Deploy to Vercel

1. Push this folder to GitHub and import it at <https://vercel.com/new>.
2. Add **all** of the variables above in **Settings → Environment Variables**
   (Production; add Preview too if you want).
3. Deploy. No other configuration is required.

### 5. Optional — scheduled queue draining

To drain older queued jobs on a schedule, enable `pg_cron` + `pg_net` in Supabase
and point them at your deployed `/api/jobs/drain` endpoint:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'drain-feedback-queue',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://<your-vercel-domain>/api/jobs/drain',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer <CRON_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
```

## Analytics

Vercel Analytics and Speed Insights are mounted in `components/analytics.tsx`
from the root layout. Together they send:

- **Page views** with route, referrer, device, browser and country.
- **Web vitals** (FCP, LCP, CLS, INP, TTFB) per page via Speed Insights.
- **Custom events** through `trackEvent()` in `lib/track.ts`. Every event carries
  an anonymous `visitor` id (a hash of the Supabase user id) so dashboards can
  build per-student funnels without exposing raw account ids.

Events tracked: `sign_in`, `sign_up`, `sign_out`, `hero_cta`,
`sample_prompt_started`, `bottom_cta`, `simulation_started`,
`evaluation_completed`, `evaluation_failed`, `quota_blocked`, `interview_started`,
`interview_completed`, `voice_started`, `voice_stopped`, `voice_error`,
`ec_rated`, `program_added`, `program_removed`, `checklist_toggled`,
`average_set`, `history_tab_viewed`, `history_sort_changed`,
`history_filter_changed`, `history_searched`, `practice_clicked`,
`breakdown_requested`, `gate_cta_clicked`, `page_error`.

No configuration is required — Vercel serves the scripts automatically in
production. In development they log to the console and send nothing.

## Historical averages

`public/history.json` holds anonymised aggregates (average admitted Top 6
average, offer count, range and per-year trend) built from the two Accepted!
outcome spreadsheets. Only aggregates are stored — no applicant details. The
Planner's **Historical averages** tab fetches this file on demand.

## Security notes

- The **secret key** and the **Groq key** are server-only. The browser only ever
  sees the Supabase publishable key, which is designed to be public.
- Row Level Security: users can only read their own `feedback_jobs`. All scoring
  runs through the server with the secret key, and jobs are inserted only by
  `/api/jobs` (migration `004`).
- Per-student daily quota and a global daily cap bound the evaluation spend.
- Mock interview audio is not uploaded or persisted. The submitted transcript is
  sent to Groq for the structured review. Optional microphone transcription uses
  the browser's speech-recognition implementation, which may process speech using
  that browser provider's service and privacy terms.
- If a key is ever shared in chat or committed, **roll it** (Supabase → Settings →
  API; Groq → console.groq.com → API Keys).

## Editing content

- `lib/persona.md` — Nova's personality and scoring rules.
- `lib/data/prompts.ts` — the simulator prompt bank.
- `lib/data/programs.ts` — the program vault (averages, requirements, deadlines).
- `public/history.json` — historical admission aggregates.
- `lib/queue.ts` — evaluation, quota and queue recovery.
- `supabase/migrations/001_init.sql` — the database schema.

## Frontend design and verification

The light application-folio design is documented in [REDESIGN_BRIEF.md](REDESIGN_BRIEF.md)
and `.interface-design/system.md`. See the [desktop/mobile screenshot gallery](docs/SCREENSHOTS.md)
and [frontend verification guide](docs/FRONTEND_VERIFICATION.md) for browser fixtures,
regression coverage, accessibility checks and the existing lint-configuration limitation.
The redesign preserves the backend integrations, data, persistence and analytics described above.

Live service activation is a separate step. The exact values and follow-up checks
are preserved in [BACKEND_CONNECTION_CHECKLIST.md](BACKEND_CONNECTION_CHECKLIST.md).
No real Supabase or Groq credentials are required to build or review the frontend.
