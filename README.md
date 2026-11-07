# Accepted! — Ontario Supp App Hub

A responsive web app that helps Ontario Grade 12 students plan applications and
practise representative supplemental prompts under realistic timers, with direct
feedback from **Nova**, a Gemini-powered writing coach. Practice prompts and
competitive ranges are planning references, not official or guaranteed data.

Stack: **Next.js 15 (Vercel) · Supabase (auth + database) · Gemini (AI scoring)**.

## Features

- **Supp App Simulator** — pick a program and format, then practice under strict
  prep/response timers (video-response practice: 30s prep / 2 min; written: 60s
  prep / 10 min).
- **Program Vault** — browse Ontario programs with supplemental-application
  references, competitive averages, formats, deadlines, search, and one-click practice.
- **OUAC & Chance Planner** — keep a private program shortlist, application
  checklist, and broad academic-alignment view in your browser.
- **Voice mock interviews** — read on-screen practice questions, optionally
  transcribe answers with browser speech recognition, and receive a structured
  Gemini review of the submitted transcript. Microphone audio is not uploaded to
  Accepted.
- **Nova AI scoring** — written answers are scored 0–100 with a verdict, strengths,
  fixes, and a model rewrite.
- **Nova Analytics** — attempts are saved to your account: scores by program, an
  8-week trend, recent attempts, and an AI breakdown of where to focus next.
- **Sign in** — email/password, powered by Supabase Auth.

## How scoring stays fast and unblocked

Scoring runs through a queue, never directly from the browser:

1. You submit an answer → a row is inserted into `feedback_jobs` (`queued`).
2. The response returns immediately; Next.js continues queue work in the
   background. A server endpoint claims queued jobs one at a time
   (`FOR UPDATE SKIP LOCKED`), calls Gemini, and writes the result back.
3. A daily counter caps evaluations (default **250/day** — the Gemini Flash free
   tier). When a 429/503 arrives, the job is requeued with exponential backoff.
4. Your browser polls status separately. If the first queued job is ready, a
   background worker is started after the status response; abandoned processing
   jobs are reclaimed after a two-minute lease. Your draft and active job ID are
   saved in browser storage, so navigating away and returning does not discard them.

An optional scheduler endpoint (`POST /api/jobs/drain`, protected by
`CRON_SECRET`) can also drive the queue, including older queued jobs.

## Setup

### 1. Supabase — create the schema

Dashboard → **SQL Editor** → run the SQL files in `supabase/migrations` in
numeric order. Existing installations should run migrations `002` and `003`:
`002` restricts public access to privileged queue functions, and `003` recovers
jobs when a background worker times out.

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
`https://your-domain.example/**`). Email/password sign-in does not require Google
OAuth credentials or a Google callback URL.

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
| `GEMINI_API_KEY` | `.env.local` | Server-only. |
| `GEMINI_MODEL` | `.env.local` | Default `gemini-3.5-flash`. |
| `GEMINI_DAILY_CAP` | `.env.local` | Default `250`. |
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

## Security notes

- The **secret key** and the **Gemini key** are server-only. The browser only ever
  sees the Supabase publishable key, which is designed to be public.
- Row Level Security: users can only insert and read their own `feedback_jobs`.
  All scoring runs through the server with the secret key.
- Per-user limits: 10 written submissions/hour and 20 Gemini summary/interview
  requests/hour. Global limit:
  `GEMINI_DAILY_CAP` evaluations/day.
- Privileged queue RPCs are executable only by `service_role`; browser-facing
  roles cannot claim jobs or alter evaluation records.
- Mock interview audio is not uploaded or persisted. The submitted transcript is
  sent to Gemini for the structured review. Optional microphone transcription
  uses the browser's speech-recognition implementation, which may process speech
  using that browser provider's service and privacy terms.
- If a key is ever shared in chat or committed, **roll it** (Supabase → Settings →
  API; Google AI Studio → API keys).

## Editing content

- `lib/persona.md` — Nova's personality and scoring rules.
- `lib/data/prompts.ts` — the simulator prompt bank.
- `lib/data/programs.ts` — the program vault (averages, requirements, deadlines).
- `lib/queue.ts` — the queue drain, backoff, and daily cap.
- `supabase/migrations/001_init.sql` — the database schema.
