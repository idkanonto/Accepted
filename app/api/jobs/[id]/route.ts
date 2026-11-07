import { NextResponse } from 'next/server';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';
import { dailyUsage } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DAILY_CAP = Number(process.env.GEMINI_DAILY_CAP || 250);

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
      'id, user_id, status, score, verdict, strengths, fixes, rewrite, error, attempts, created_at'
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

  try {
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
  } catch (issue) {
    console.error('Could not read feedback queue usage:', issue);
    return NextResponse.json({ error: 'Could not load evaluation status.' }, { status: 503 });
  }
}
