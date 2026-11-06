import { NextResponse } from 'next/server';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** All of the signed-in user's practice history. */
export async function GET(req: Request) {
  const user = await getSessionUser(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from('feedback_jobs')
    .select(
      'id, program, program_code, university, question, answer, status, score, verdict, strengths, fixes, rewrite, created_at'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: 'Could not load history.' }, { status: 500 });

  return NextResponse.json({ jobs: data ?? [] });
}

/** Delete the signed-in user's practice history. */
export async function DELETE(req: Request) {
  const user = await getSessionUser(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await getSupabaseAdmin()
    .from('feedback_jobs')
    .delete()
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Could not clear history.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
