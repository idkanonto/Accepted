-- Recover jobs when a serverless queue worker times out after claiming them.
-- A live feedback request should finish well before this lease expires.
create or replace function public.claim_feedback_jobs(p_limit int default 1)
returns setof public.feedback_jobs
language plpgsql
security definer
set search_path = ''
as $$
begin
  return query
  with ready as (
    select j.id, j.status
    from public.feedback_jobs j
    where (
      j.status = 'queued'
      and (j.not_before is null or j.not_before <= now())
    ) or (
      j.status = 'processing'
      and j.claimed_at < now() - interval '2 minutes'
    )
    order by j.created_at
    limit greatest(1, least(coalesce(p_limit, 1), 10))
    for update skip locked
  )
  update public.feedback_jobs j
  set status = 'processing',
      claimed_at = now(),
      not_before = null,
      attempts = j.attempts + case when ready.status = 'processing' then 1 else 0 end
  from ready
  where j.id = ready.id
  returning j.*;
end;
$$;

-- Only count evaluations when a processing job was actually completed.
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
set search_path = ''
as $$
declare
  updated_rows integer;
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

  get diagnostics updated_rows = row_count;
  if updated_rows = 0 then
    return;
  end if;

  insert into public.daily_usage (date, count, cap)
  values (current_date, 1, 250)
  on conflict (date) do update set count = daily_usage.count + 1;
end;
$$;

revoke all on function public.claim_feedback_jobs(int) from public, anon, authenticated;
revoke all on function public.complete_feedback_job(uuid, integer, text, jsonb, jsonb, text) from public, anon, authenticated;
grant execute on function public.claim_feedback_jobs(int) to service_role;
grant execute on function public.complete_feedback_job(uuid, integer, text, jsonb, jsonb, text) to service_role;
