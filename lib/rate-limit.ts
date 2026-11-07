import { getSupabaseAdmin } from '@/lib/supabase/server';

/** Hourly per-user limit shared by the Nova breakdown, interview and EC routes. */
export async function consumeRateLimit(userId: string, limit = 20): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('summary_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', since);
  if (error) throw new Error('Could not verify the usage limit.');
  if ((count ?? 0) >= limit) return false;
  const { error: insertError } = await supabase.from('summary_usage').insert({ user_id: userId });
  if (insertError) throw new Error('Could not record usage.');
  return true;
}
