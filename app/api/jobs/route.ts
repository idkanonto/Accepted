import { NextResponse } from 'next/server';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';
import { queuedCount } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOURLY_LIMIT = 10;

/** Queue a written answer for async scoring. */
export async function POST(req: Request) {
  const user = await getSessionUser(req.headers.get('authorization'));
  if (!user) {
    return NextResponse.json({ error: 'Sign in to get scored.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const question = typeof body?.question === 'string' ? body.question.trim() : '';
  const answer = typeof body?.answer === 'string' ? body.answer.trim() : '';

  if (!question || answer.length < 20) {
    return NextResponse.json(
      { error: 'Write at least a sentence or two before submitting.' },
      { status: 400 }
    );
  }

  // Per-user hourly throttle — keeps one student from flooding the queue.
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await getSupabaseAdmin()
    .from('feedback_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', since);

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
    return NextResponse.json({ error: 'Could not queue your answer.' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, queued: await queuedCount() });
}
