import { after, NextResponse } from 'next/server';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';
import { drainQueue } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOURLY_LIMIT = 10;
export const maxDuration = 30;

/** Queue an answer for background scoring and return without holding the request open. */
export async function POST(req: Request) {
  const user = await getSessionUser(req.headers.get('authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Sign in to get scored.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const answer = typeof body?.answer === 'string' ? body.answer.trim() : '';

  if (!question || question.length > 2000 || answer.length < 20 || answer.length > 6000) {
    return NextResponse.json(
      { error: 'Include a question and an answer between 20 and 6,000 characters.' },
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

  // Per-user hourly throttle — keeps one student from flooding the queue.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await getSupabaseAdmin()
    .from('feedback_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);
  if (countError) {
    console.error('Could not verify submission rate limit:', countError);
    return NextResponse.json({ error: 'Could not verify the submission limit.' }, { status: 503 });
  }

  if ((count ?? 0) >= HOURLY_LIMIT) {
    return NextResponse.json(
      { error: 'Hourly limit reached. Try again in a bit.' },
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
      status: 'queued',
    })
    .select('id, created_at')
    .single();

  if (error || !data) {
    console.error('Could not create feedback job:', error);
    return NextResponse.json({ error: 'Could not queue your answer.' }, { status: 500 });
  }

  after(async () => {
    try {
      await drainQueue();
    } catch (issue) {
      console.error('Background feedback queue drain failed:', issue);
    }
  });

  return NextResponse.json({ id: data.id, queued: null }, { status: 202 });
}
