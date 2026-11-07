-- Accepted! — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.feedback_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_code text not null default '',
  program text not null default '',
  university text not null default '',
  format text not null default 'written',
  question text not null,
  answer text not null,
  status text not null default 'queued', -- queued | processing | done | failed
  score integer,
  verdict text,
  strengths jsonb,
  fixes jsonb,
  rewrite text,
  error text,
  attempts integer not null default 0,
  not_before timestamptz,
  claimed_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_jobs_user_created_idx
  on public.feedback_jobs (user_id, created_at desc);
create index if not exists feedback_jobs_status_created_idx
  on public.feedback_jobs (status, created_at);

create table if not exists public.daily_usage (
  date date primary key,
  count integer not null default 0,
  cap integer not null default 250
);

-- Per-user record of Nova summary calls (light abuse protection).
create table if not exists public.summary_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists summary_usage_user_created_idx
  on public.summary_usage (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.feedback_jobs enable row level security;
alter table public.daily_usage enable row level security;
alter table public.summary_usage enable row level security;

-- Users may only ever see and create their own jobs. Updates/deletes happen
-- server-side with the secret key (service role bypasses RLS).
create policy "users can insert own jobs"
  on public.feedback_jobs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can select own jobs"
  on public.feedback_jobs for select
  to authenticated
  using (auth.uid() = user_id);

-- daily_usage: no policies = no direct access. The service role bypasses RLS.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists feedback_jobs_set_updated_at on public.feedback_jobs;
create trigger feedback_jobs_set_updated_at
  before update on public.feedback_jobs
  for each row execute function public.set_updated_at();

-- Atomically claim queued jobs (race-safe across serverless invocations).
create or replace function public.claim_feedback_jobs(p_limit int default 1)
returns setof public.feedback_jobs
language plpgsql
security definer
as $$
begin
  return query
  with claimed as (
    select id from public.feedback_jobs
    where status = 'queued'
      and (not_before is null or not_before <= now())
    order by created_at
    limit p_limit
    for update skip locked
  )
  update public.feedback_jobs j
  set status = 'processing', claimed_at = now()
  from claimed
  where j.id = claimed.id
  returning j.*;
end;
$$;

-- Mark a job done and count it against today's usage, atomically.
create or replace function public.complete_feedback_job(
  p_job_id uuid,
  p_score integer,
  p_verdict text,
  p_strengths jsonb,
  p_fixes jsonb,
  p_rewrite text
) returns void
language plpgsql
security definer
as $$
begin
  update public.feedback_jobs
  set status = 'done',
      score = p_score,
      verdict = p_verdict,
      strengths = p_strengths,
      fixes = p_fixes,
      rewrite = p_rewrite,
      error = null,
      processed_at = now()
  where id = p_job_id and status = 'processing';

  insert into public.daily_usage (date, count, cap)
  values (current_date, 1, 250)
  on conflict (date) do update set count = daily_usage.count + 1;
end;
$$;

-- Requeue a job after a rate-limit / overload response.
create or replace function public.requeue_feedback_job(
  p_job_id uuid,
  p_error text,
  p_attempts integer,
  p_not_before timestamptz
) returns void
language plpgsql
security definer
as $$
begin
  update public.feedback_jobs
  set status = 'queued',
      error = p_error,
      attempts = p_attempts,
      not_before = p_not_before,
      claimed_at = null
  where id = p_job_id;
end;
$$;

-- Permanently fail a job (bad input, repeated errors, etc.).
create or replace function public.fail_feedback_job(p_job_id uuid, p_error text)
returns void
language plpgsql
security definer
as $$
begin
  update public.feedback_jobs
  set status = 'failed', error = p_error, processed_at = now()
  where id = p_job_id;
end;
$$;

-- Today's usage count.
create or replace function public.daily_usage_count(p_date date default current_date)
returns integer
language sql
security definer
as $$
  select coalesce(count, 0)::int from public.daily_usage where date = p_date;
$$;

-- Queue depth (for showing a student their position).
create or replace function public.queued_count()
returns integer
language sql
security definer
as $$
  select count(*)::int from public.feedback_jobs where status = 'queued';
$$;

-- These functions bypass row-level security and are only called by the server.
revoke all on function public.claim_feedback_jobs(int) from public, anon, authenticated;
revoke all on function public.complete_feedback_job(uuid, integer, text, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.requeue_feedback_job(uuid, text, integer, timestamptz) from public, anon, authenticated;
revoke all on function public.fail_feedback_job(uuid, text) from public, anon, authenticated;
revoke all on function public.daily_usage_count(date) from public, anon, authenticated;
revoke all on function public.queued_count() from public, anon, authenticated;

grant execute on function public.claim_feedback_jobs(int) to service_role;
grant execute on function public.complete_feedback_job(uuid, integer, text, jsonb, jsonb, text) to service_role;
grant execute on function public.requeue_feedback_job(uuid, text, integer, timestamptz) to service_role;
grant execute on function public.fail_feedback_job(uuid, text) to service_role;
grant execute on function public.daily_usage_count(date) to service_role;
grant execute on function public.queued_count() to service_role;
