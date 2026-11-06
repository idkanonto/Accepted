import { NextResponse } from 'next/server';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';
import { drainQueue, dailyUsage } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_CAP = Number(process.env.GEMINI_DAILY_CAP || 250);

/** Poll a job's status. Each poll also drains the queue a little. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  await drainQueue();

  const { data, error } = await getSupabaseAdmin()
    .from('feedback_jobs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let position: number | null = null;
  if (data.status === 'queued') {
    const { count } = await getSupabaseAdmin()
      .from('feedback_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued')
      .lt('created_at', data.created_at);
    position = (count ?? 0) + 1;
  }

  return NextResponse.json({
    id: data.id,
    status: data.status,
    position,
    capReached: (await dailyUsage()) >= DAILY_CAP,
    score: data.score,
    verdict: data.verdict,
    strengths: data.strengths,
    fixes: data.fixes,
    rewrite: data.rewrite,
    error: data.error,
    attempts: data.attempts,
    createdAt: data.created_at,
  });
}
