import { NextResponse } from 'next/server';
import { generateJSON, getPersona } from '@/lib/ai';
import { getSessionUser, getSupabaseAdmin } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUMMARY_HOURLY_LIMIT = 20;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: {
      type: 'STRING',
      description: 'Three to four sentences. The overall read on the applicant.',
    },
    strengths: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Up to four bullets on where the applicant is genuinely strong.',
    },
    focusAreas: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Up to four bullets on where marks are being lost.',
    },
    actions: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: 'Exactly three concrete actions for the coming week.',
    },
  },
  required: ['summary', 'strengths', 'focusAreas', 'actions'],
};

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req.headers.get('authorization'));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await getSupabaseAdmin()
      .from('summary_usage')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since);
    if ((count ?? 0) >= SUMMARY_HOURLY_LIMIT) {
      return NextResponse.json(
        { error: 'Too many breakdowns. Try again later.' },
        { status: 429 }
      );
    }
    await getSupabaseAdmin().from('summary_usage').insert({ user_id: user.id });

    const body = await req.json().catch(() => null);
    const stats = body?.stats;
    if (!stats || typeof stats !== 'object') {
      return NextResponse.json({ error: 'stats are required' }, { status: 400 });
    }

    const prompt = `${getPersona()}

---

You are reviewing an applicant's practice record from the Accepted! platform. The
data below is real: every score came from your own evaluations of their answers.

Practice record:
\`\`\`json
${JSON.stringify(stats, null, 2)}
\`\`\`

Write the breakdown the applicant needs — not a pep talk.

- summary: the overall read. Where are they, and what is the one pattern that
  explains most of their scores?
- strengths: what is genuinely working, tied to the data.
- focusAreas: where marks are being lost, tied to the data.
- actions: exactly three concrete things to do next week, ordered by impact.

No fluff. No praise. Clear English. Return the JSON only.`;

    const result = await generateJSON<{
      summary: string;
      strengths: string[];
      focusAreas: string[];
      actions: string[];
    }>(prompt, SCHEMA);

    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Summary failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
