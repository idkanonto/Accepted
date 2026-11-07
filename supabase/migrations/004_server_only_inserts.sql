-- Jobs are created only by /api/jobs (server, secret key). Without this, any signed-in
-- user could insert rows straight from the browser: skipping the hourly limit, the daily
-- cap, and even writing fake scores into their own analytics.
drop policy if exists "users can insert own jobs" on public.feedback_jobs;
revoke insert, update, delete on public.feedback_jobs from anon, authenticated;
