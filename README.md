# Accepted! — Ontario Supp App Hub

A responsive web app that helps Ontario Grade 12 students practice the
supplemental application prompts universities actually ask — under real timers —
and get scored, no-fluff feedback from **Nova**, a Gemini-powered admissions
evaluator.

Stack: **Next.js 15 (Vercel) · Supabase (auth + database) · Gemini (AI scoring)**.

## Features

- **Supp App Simulator** — pick a program and format, then practice under strict
  prep/response timers (video: 30s prep / 2 min record; written: 60s prep / 10 min
  write).
- **Program Vault** — every Ontario program requiring a supplemental application,
  with competitive averages, formats, deadlines, search, and one-click practice.
- **Nova AI scoring** — written answers are scored 0–100 with a verdict, strengths,
  fixes, and a model rewrite.
- **Nova Analytics** — attempts are saved to your account: scores by program, an
  8-week trend, recent attempts, and an AI breakdown of where to focus next.
- **Sign in** — email/password or Google, powered by Supabase Auth.

## How scoring stays fast and unblocked

Scoring runs through a queue, never directly from the browser:

1. You submit an answer → a row is inserted into `feedback_jobs` (`queued`).
2. A server endpoint claims queued jobs one at a time (`FOR UPDATE SKIP LOCKED`),
   calls Gemini, and writes the result back.
3. A daily counter caps evaluations (default **250/day** — the Gemini Flash free
   tier). When a 429/503 arrives, the job is requeued with exponential backoff.
4. Your browser polls until the job is `done`, showing your queue position.

The queue drains whenever anyone polls, so no background worker is required on
Vercel's free tier. An optional scheduler endpoint (`POST /api/jobs/drain`,
protected by `CRON_SECRET`) can also drive it — see below.

## Setup

### 1. Supabase — create the schema

Dashboard → **SQL Editor** → New query → paste the contents of
`supabase/migrations/001_init.sql` → **Run**.

This creates `feedback_jobs`, `daily_usage`, `summary_usage`, Row Level Security
policies, and the queue functions. Nothing else is required — Supabase Auth is
built in.

### 2. Supabase — auth settings

Dashboard → **Authentication** → **Sign In / Providers** → **Email**:

- Turn **off** "Confirm email" if you want sign-up to be instant (recommended for
  students). Leave it on if you want the extra security of email verification.

Optional — Google sign-in:

- Dashboard → **Authentication** → **Sign In / Providers** → **Google** → enable.
- You need a Google Cloud OAuth client (APIs & Services → Credentials → OAuth
  client ID → Web). Add `https://<your-project>.supabase.co/auth/v1/callback` as
  an authorized redirect URI, plus your Vercel domain under
  **Authentication → URL Configuration → Redirect URLs**.

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

Without it, the queue drains whenever a student polls (good enough for most
days). To also drain on a schedule, enable `pg_cron` + `pg_net` in Supabase and
point them at your deployed `/api/jobs/drain` endpoint:

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
- Per-user limits: 10 submissions/hour, 20 breakdowns/hour. Global limit:
  `GEMINI_DAILY_CAP` evaluations/day.
- If a key is ever shared in chat or committed, **roll it** (Supabase → Settings →
  API; Google AI Studio → API keys).

## Editing content

- `lib/persona.md` — Nova's personality and scoring rules.
- `lib/data/prompts.ts` — the simulator prompt bank.
- `lib/data/programs.ts` — the program vault (averages, requirements, deadlines).
- `lib/queue.ts` — the queue drain, backoff, and daily cap.
- `supabase/migrations/001_init.sql` — the database schema.
