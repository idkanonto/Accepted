import { NextResponse } from 'next/server';
import { drainQueue, dailyUsage } from '@/lib/queue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Optional queue driver for a scheduler (e.g. Supabase pg_cron). New
 * submissions also start a background drain. Protect this endpoint with
 * CRON_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 404 });
  }
  const provided = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await drainQueue();
  return NextResponse.json({ ...result, usage: await dailyUsage() });
}
