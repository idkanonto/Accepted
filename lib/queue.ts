import { getSupabaseAdmin } from '@/lib/supabase/server';
import { generateJSON, getPersona } from '@/lib/ai';

const DAILY_CAP = Number(process.env.GEMINI_DAILY_CAP || 250);
const MAX_ATTEMPTS = 5;
const MAX_DRAIN_MS = 9000;
const SPACE_BETWEEN_CALLS_MS = 400;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER', description: 'Score from 0 to 100.' },
    verdict: { type: 'STRING', description: 'Two to three sentences. Direct, no praise.' },
    strengths: { type: 'ARRAY', items: { type: 'STRING' } },
    fixes: { type: 'ARRAY', items: { type: 'STRING' } },
    rewrite: { type: 'STRING' },
  },
  required: ['score', 'verdict', 'strengths', 'fixes', 'rewrite'],
};

type Job = {
  id: string;
  user_id: string;
  question: string;
  answer: string;
  program: string;
  university: string;
  attempts: number;
};

const RATE_LIMIT = /429|503|RESOURCE_EXHAUSTED|UNAVAILABLE|overload|rate.?limit|too many/i;
const BAD_JSON = /INVALID_JSON|unterminated|unexpected end|JSON/i;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function dailyUsage(): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc('daily_usage_count');
  if (error) return 0;
  return typeof data === 'number' ? data : 0;
}

export async function queuedCount(): Promise<number> {
  const { data, error } = await getSupabaseAdmin().rpc('queued_count');
  if (error) return 0;
  return typeof data === 'number' ? data : 0;
}

/**
 * Drain the queue: claim up to a few queued jobs, call Gemini for each, and
 * write the result back. Bounded by MAX_DRAIN_MS so a request never hangs.
 * Safe to call concurrently — jobs are claimed with FOR UPDATE SKIP LOCKED.
 */
export async function drainQueue(): Promise<{ processed: number; capReached: boolean }> {
  const start = Date.now();
  let processed = 0;

  if ((await dailyUsage()) >= DAILY_CAP) {
    return { processed: 0, capReached: true };
  }

  for (;;) {
    if (Date.now() - start > MAX_DRAIN_MS) break;
    if ((await dailyUsage()) >= DAILY_CAP) break;

    const { data: jobs, error } = await getSupabaseAdmin().rpc('claim_feedback_jobs', {
      p_limit: 1,
    });
    if (error || !Array.isArray(jobs) || jobs.length === 0) break;

    const job = jobs[0] as Job;
    processed += 1;

    try {
      const result = await generateJSON<{
        score: number;
        verdict: string;
        strengths: string[];
        fixes: string[];
        rewrite: string;
      }>(buildPrompt(job), SCHEMA);

      await getSupabaseAdmin().rpc('complete_feedback_job', {
        p_job_id: job.id,
        p_score: Math.max(0, Math.min(100, Math.round(result.score))),
        p_verdict: String(result.verdict ?? ''),
        p_strengths: JSON.stringify(result.strengths ?? []),
        p_fixes: JSON.stringify(result.fixes ?? []),
        p_rewrite: String(result.rewrite ?? ''),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Evaluation failed.';
      const attempts = (job.attempts ?? 0) + 1;

      if ((RATE_LIMIT.test(message) || BAD_JSON.test(message)) && attempts < MAX_ATTEMPTS) {
        // Rate limits get exponential backoff; a truncated/invalid JSON response
        // is a transient hiccup, so retry it quickly instead of making the
        // student wait two minutes.
        const backoffMs = RATE_LIMIT.test(message)
          ? Math.min(60_000 * 2 ** attempts, 3_600_000)
          : 5_000;
        await getSupabaseAdmin().rpc('requeue_feedback_job', {
          p_job_id: job.id,
          p_error: message.slice(0, 500),
          p_attempts: attempts,
          p_not_before: new Date(Date.now() + backoffMs).toISOString(),
        });
      } else {
        await getSupabaseAdmin().rpc('fail_feedback_job', {
          p_job_id: job.id,
          p_error: message.slice(0, 500),
        });
      }
    }

    if (Date.now() - start > MAX_DRAIN_MS) break;
    await sleep(SPACE_BETWEEN_CALLS_MS);
  }

  return { processed, capReached: (await dailyUsage()) >= DAILY_CAP };
}

function buildPrompt(job: Job): string {
  return `${getPersona()}

---

Evaluate the following supplemental application answer.

University: ${job.university || 'Not specified'}
Program: ${job.program || 'General'}

Question:
${job.question}

Applicant answer:
"""
${job.answer}
"""

Word count: ${job.answer.trim().split(/\s+/).filter(Boolean).length}

Score it 0-100 against the criteria in your instructions. Be strict, specific, and direct. Return the JSON only.`;
}
