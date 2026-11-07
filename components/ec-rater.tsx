'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquareWarning, Plus, Trash2 } from 'lucide-react';
import { UNIVERSITIES } from '@/lib/data/programs';
import { EC_KEY, type EcLevel } from '@/lib/position';
import { authFetch } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/track';

type Ec = { id: string; name: string; role: string; duration: string; hours: string; detail: string };
type Result = {
  summary: string;
  overallLevel: EcLevel;
  ranked: { name: string; tier: EcLevel; why: string; leverage: string }[];
  gaps: string[];
};

const DRAFT_KEY = 'accepted-ecs-draft-v1';
const MAX_ECS = 8;
const blank = (): Ec => ({ id: crypto.randomUUID(), name: '', role: '', duration: '', hours: '', detail: '' });

const TIER: Record<EcLevel, string> = {
  standout: 'bg-accent text-ink',
  strong: 'bg-accent-deep text-cream',
  solid: 'border border-line text-cream',
  light: 'border border-line text-muted',
};

const field =
  'w-full rounded-lg border border-line bg-ink p-2.5 text-sm text-cream outline-none focus:border-accent';

export default function EcRater() {
  const [ecs, setEcs] = useState<Ec[]>([blank()]);
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
      if (Array.isArray(d?.ecs) && d.ecs.length) setEcs(d.ecs.slice(0, MAX_ECS));
      if (typeof d?.target === 'string') setTarget(d.target);
    } catch {
      // a bad draft just starts fresh
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ecs, target }));
    } catch {
      // storage unavailable: drafts just won't persist
    }
  }, [ecs, target, ready]);

  const update = (id: string, patch: Partial<Ec>) =>
    setEcs((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  async function rate() {
    if (ecs.some((e) => !e.name.trim())) {
      setError('Give every activity a name, or remove the empty ones.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authFetch('/api/ec', {
        method: 'POST',
        body: JSON.stringify({
          target,
          ecs: ecs.map((e) => ({ ...e, hours: Number(e.hours) || 0 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not rate your ECs.');
        return;
      }
      setResult(data);
      trackEvent('ec_rated', { count: String(ecs.length), level: data.overallLevel });
      try {
        localStorage.setItem(EC_KEY, JSON.stringify({ level: data.overallLevel }));
      } catch {
        // the planner just won't see the level
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="eyebrow">EC Rater</p>
        <h1 className="mt-3 text-3xl font-medium leading-tight text-cream sm:text-4xl">
          Rank your activities. Make them count.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          List what you do outside class. Nova ranks it by depth, responsibility and impact, then
          tells you how to turn each activity into something you can speak to honestly. Your
          overall level also shows up in the Planner and Programs.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel space-y-4 p-5 sm:p-6">
          <div>
            <label htmlFor="ec-target" className="mb-1 block text-xs font-medium text-muted">
              Target program (optional)
            </label>
            <select id="ec-target" value={target} onChange={(e) => setTarget(e.target.value)} className={field}>
              <option value="">No specific program</option>
              {UNIVERSITIES.map((u) => (
                <optgroup key={u.key} label={u.name}>
                  {u.programs.map((p) => (
                    <option key={p.name} value={`${u.name}: ${p.name}`}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {ecs.map((ec, i) => (
            <fieldset key={ec.id} className="space-y-3 rounded-xl border border-line bg-ink/50 p-4">
              <div className="flex items-center justify-between">
                <legend className="text-xs font-semibold uppercase tracking-wider text-accent">
                  Activity {i + 1}
                </legend>
                {ecs.length > 1 && (
                  <button
                    onClick={() => setEcs((l) => l.filter((e) => e.id !== ec.id))}
                    aria-label={`Remove activity ${i + 1}`}
                    className="rounded-lg p-1.5 text-muted transition hover:text-rose"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <input aria-label="Activity name" value={ec.name} maxLength={80} placeholder="Activity (e.g. Robotics Club)"
                onChange={(e) => update(ec.id, { name: e.target.value })} className={field} />
              <div className="grid gap-3 sm:grid-cols-3">
                <input aria-label="Your role" value={ec.role} maxLength={80} placeholder="Your role"
                  onChange={(e) => update(ec.id, { role: e.target.value })} className={field} />
                <input aria-label="How long" value={ec.duration} maxLength={40} placeholder="How long (2 yrs)"
                  onChange={(e) => update(ec.id, { duration: e.target.value })} className={field} />
                <input aria-label="Hours per week" value={ec.hours} inputMode="numeric" placeholder="Hrs / week"
                  onChange={(e) => update(ec.id, { hours: e.target.value.replace(/\D/g, '').slice(0, 2) })} className={field} />
              </div>
              <textarea aria-label="What you did and what changed" value={ec.detail} maxLength={600} rows={3}
                placeholder="What did you actually do, and what changed because of it? Numbers help."
                onChange={(e) => update(ec.id, { detail: e.target.value })} className={`${field} resize-y`} />
            </fieldset>
          ))}

          {ecs.length < MAX_ECS && (
            <button
              onClick={() => setEcs((l) => [...l, blank()])}
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              <Plus className="h-4 w-4" /> Add activity
            </button>
          )}

          {error && (
            <div role="alert" className="flex items-center gap-2 border-l-2 border-rose bg-mortuum/40 px-4 py-3 text-sm text-rose">
              <MessageSquareWarning className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={rate}
            disabled={loading}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-ink transition hover:bg-accent-soft disabled:opacity-60"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Rating…</> : 'Rank my ECs'}
          </button>
        </section>

        <section className="panel min-h-[320px] p-5 sm:p-6" aria-live="polite">
          {!result ? (
            <p className="my-16 text-center text-sm text-muted">
              Your ranking and advice will appear here.
            </p>
          ) : (
            <div className="space-y-6">
              <div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${TIER[result.overallLevel]}`}>
                  Overall: {result.overallLevel}
                </span>
                <p className="mt-3 text-[15px] leading-relaxed text-cream">{result.summary}</p>
              </div>

              <ol className="space-y-4">
                {result.ranked.map((r, i) => (
                  <li key={`${r.name}-${i}`} className="rounded-xl border border-line bg-ink/50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-medium text-cream">
                        {i + 1}. {r.name}
                      </h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${TIER[r.tier]}`}>
                        {r.tier}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{r.why}</p>
                    <p className="mt-2 text-sm leading-6 text-cream">
                      <span className="font-semibold text-accent">Make it count: </span>
                      {r.leverage}
                    </p>
                  </li>
                ))}
              </ol>

              {result.gaps.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-cream">Gaps to close</h3>
                  <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted">
                    {result.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
