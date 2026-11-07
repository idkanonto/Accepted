import { after, NextResponse } from 'next/server';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';
import { dailyUsage, drainQueue } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const DAILY_CAP = Number(process.env.GROQ_DAILY_CAP || 250);

/** Read a job's status without doing background scoring work in the polling request. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const { data, error } = await getSupabaseAdmin()
    .from('feedback_jobs')
    .select(
      'id, user_id, status, score, verdict, strengths, fixes, rewrite, error, attempts, created_at, claimed_at, not_before'
    )
    .eq('id', id)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (data.user_id !== user.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let position: number | null = null;
  if (data.status === 'queued') {
    const { count, error: countError } = await getSupabaseAdmin()
      .from('feedback_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'queued')
      .lt('created_at', data.created_at);
    if (countError) {
      console.error('Could not read feedback queue position:', countError);
    } else {
      position = (count ?? 0) + 1;
    }
  }

  const retryReady =
    data.not_before === null || new Date(data.not_before).getTime() <= Date.now();
  const staleClaim =
    data.status === 'processing' &&
    data.claimed_at !== null &&
    new Date(data.claimed_at).getTime() < Date.now() - 2 * 60 * 1000;

  if ((data.status === 'queued' && position === 1 && retryReady) || staleClaim) {
    after(async () => {
      try {
        await drainQueue();
      } catch (issue) {
        console.error('Background feedback queue recovery failed:', issue);
      }
    });
  }

  try {
    return NextResponse.json({
      id: data.id,
      status: data.status,
      position,
      capReached:
        data.status === 'queued' || data.status === 'processing'
          ? (await dailyUsage()) >= DAILY_CAP
          : false,
      score: data.score,
      verdict: data.verdict,
      strengths: data.strengths,
      fixes: data.fixes,
      rewrite: data.rewrite,
      error: data.error,
      attempts: data.attempts,
      createdAt: data.created_at,
    });
  } catch (issue) {
    console.error('Could not read feedback queue usage:', issue);
    return NextResponse.json({ error: 'Could not load evaluation status.' }, { status: 503 });
  }
}
