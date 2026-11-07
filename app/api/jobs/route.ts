import { NextResponse } from 'next/server';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';
import { dailyUsage, evaluateAnswer, userDailyUsage, USER_DAILY_CAP } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DAILY_CAP = Number(process.env.GROQ_DAILY_CAP || 250);
const MIN_CHARS = 20;
const MAX_CHARS = 4000;
const MAX_WORDS = 500;

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function resetAt(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString();
}

/** Score an answer immediately and return the result in the same response. */
export async function POST(req: Request) {
  const user = await getSessionUser(req.headers.get('authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Sign in to get scored.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const answer = typeof body?.answer === 'string' ? body.answer.trim() : '';

  if (
    !question ||
    question.length > 2000 ||
    answer.length < MIN_CHARS ||
    answer.length > MAX_CHARS ||
    wordCount(answer) > MAX_WORDS
  ) {
    return NextResponse.json(
      {
        error: `Include a question and an answer between ${MIN_CHARS} characters and ${MAX_WORDS} words.`,
      },
      { status: 400 }
    );
  }
  if (
    (body?.format !== undefined && body.format !== 'written' && body.format !== 'video') ||
    (body?.programCode !== undefined && typeof body.programCode !== 'string') ||
    (body?.program !== undefined && typeof body.program !== 'string') ||
    (body?.university !== undefined && typeof body.university !== 'string') ||
    String(body?.program ?? '').length > 160 ||
    String(body?.university ?? '').length > 120
  ) {
    return NextResponse.json({ error: 'Some application details are invalid.' }, { status: 400 });
  }

  let usedToday = 0;
  try {
    usedToday = await userDailyUsage(user.id);
  } catch (e) {
    console.error('Could not verify the daily limit:', e);
    return NextResponse.json({ error: 'Could not verify your daily limit.' }, { status: 503 });
  }
  if (usedToday >= USER_DAILY_CAP) {
    return NextResponse.json(
      {
        error: `You have used all ${USER_DAILY_CAP} free evaluations for today. Come back tomorrow.`,
        quota: { used: usedToday, limit: USER_DAILY_CAP, resetAt: resetAt() },
      },
      { status: 429 }
    );
  }

  if ((await dailyUsage()) >= DAILY_CAP) {
    return NextResponse.json(
      {
        error: 'Every free evaluation for today is gone. Come back tomorrow.',
        quota: { used: usedToday, limit: USER_DAILY_CAP, resetAt: resetAt() },
      },
      { status: 429 }
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from('feedback_jobs')
    .insert({
      user_id: user.id,
      program_code: String(body?.programCode ?? ''),
      program: String(body?.program ?? ''),
      university: String(body?.university ?? ''),
      format: String(body?.format ?? 'written'),
      question,
      answer,
      status: 'processing',
      claimed_at: new Date().toISOString(),
    })
    .select('id, created_at')
    .single();

  if (error || !data) {
    console.error('Could not create feedback job:', error);
    return NextResponse.json({ error: 'Could not queue your answer.' }, { status: 500 });
  }

  try {
    const result = await evaluateAnswer({
      id: data.id,
      user_id: user.id,
      question,
      answer,
      program: String(body?.program ?? ''),
      university: String(body?.university ?? ''),
      attempts: 0,
    });

    const { error: completeError } = await getSupabaseAdmin().rpc('complete_feedback_job', {
      p_job_id: data.id,
      p_score: result.score,
      p_verdict: result.verdict,
      p_strengths: JSON.stringify(result.strengths),
      p_fixes: JSON.stringify(result.fixes),
      p_rewrite: result.rewrite,
    });
    if (completeError) throw new Error(`Could not save evaluation: ${completeError.message}`);

    return NextResponse.json({
      id: data.id,
      status: 'done',
      score: result.score,
      verdict: result.verdict,
      strengths: result.strengths,
      fixes: result.fixes,
      rewrite: result.rewrite,
      quota: { used: usedToday + 1, limit: USER_DAILY_CAP, resetAt: resetAt() },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Evaluation failed.';
    console.error('Scoring failed:', message);
    try {
      await getSupabaseAdmin().rpc('fail_feedback_job', {
        p_job_id: data.id,
        p_error: message.slice(0, 500),
      });
    } catch (issue) {
      console.error('Could not mark the job as failed:', issue);
    }
    return NextResponse.json(
      { error: 'Could not score this answer. Please try again in a moment.' },
      { status: 502 }
    );
  }
}
