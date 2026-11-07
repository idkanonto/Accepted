-- Privileged queue functions run with elevated rights and must only be
-- callable from the server using the Supabase service role.
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
