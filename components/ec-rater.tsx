'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Loader2,
  MessageSquareWarning,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { UNIVERSITIES } from '@/lib/data/programs';
import { EC_KEY, type EcLevel } from '@/lib/position';
import { authFetch } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/track';
import { EmptyState, Notice, PageHeading } from './ui';

type Ec = {
  id: string;
  name: string;
  role: string;
  duration: string;
  hours: string;
  detail: string;
};
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
  standout: 'bg-accent text-white',
  strong: 'bg-accent-deep text-accent',
  solid: 'border border-line text-cream',
  light: 'border border-line text-muted',
};

const field = 'input !bg-panel';

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
    <div>
      <PageHeading
        eyebrow="PREPARE & PRACTISE / ACTIVITY RATER"
        title="There’s a story in what you do."
      >
        List what you do outside class. Nova looks at depth, responsibility and impact, then helps
        you explain your experience honestly. Your overall level also appears in the Planner and
        Programs.
      </PageHeading>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="panel min-w-0 space-y-6 p-5 sm:p-6" aria-label="Your activity profile">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">01 / YOUR EXPERIENCES</p>
              <h2 className="section-heading mt-2">Beyond the classroom</h2>
            </div>
            <span className="chip">
              {ecs.length} / {MAX_ECS} activities
            </span>
          </div>
          <div>
            <label htmlFor="ec-target" className="label">
              Target program <span className="font-normal">(optional)</span>
            </label>
            <select
              id="ec-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="input"
            >
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
          <div>
            {ecs.map((ec, i) => (
              <fieldset
                key={ec.id}
                className="activity-sheet min-w-0 rounded-2xl border border-line bg-ink/40 p-4 sm:p-5"
              >
                <legend className="px-2 text-xs font-semibold text-accent">
                  Activity {String(i + 1).padStart(2, '0')}
                </legend>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">An experience worth reflecting on.</p>
                  {ecs.length > 1 && (
                    <button
                      onClick={() => setEcs((l) => l.filter((e) => e.id !== ec.id))}
                      aria-label={`Remove activity ${i + 1}`}
                      className="icon-button hover:!text-rose"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div>
                  <label htmlFor={`ec-name-${ec.id}`} className="label">
                    Activity name
                  </label>
                  <input
                    id={`ec-name-${ec.id}`}
                    aria-label="Activity name"
                    value={ec.name}
                    maxLength={80}
                    placeholder="e.g. Robotics Club"
                    onChange={(e) => update(ec.id, { name: e.target.value })}
                    className={field}
                  />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor={`ec-role-${ec.id}`} className="label">
                      Your role
                    </label>
                    <input
                      id={`ec-role-${ec.id}`}
                      aria-label="Your role"
                      value={ec.role}
                      maxLength={80}
                      placeholder="e.g. Team lead"
                      onChange={(e) => update(ec.id, { role: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor={`ec-duration-${ec.id}`} className="label">
                      How long
                    </label>
                    <input
                      id={`ec-duration-${ec.id}`}
                      aria-label="How long"
                      value={ec.duration}
                      maxLength={40}
                      placeholder="e.g. 2 years"
                      onChange={(e) => update(ec.id, { duration: e.target.value })}
                      className={field}
                    />
                  </div>
                  <div>
                    <label htmlFor={`ec-hours-${ec.id}`} className="label">
                      Hours / week
                    </label>
                    <input
                      id={`ec-hours-${ec.id}`}
                      aria-label="Hours per week"
                      value={ec.hours}
                      inputMode="numeric"
                      placeholder="e.g. 4"
                      onChange={(e) =>
                        update(ec.id, { hours: e.target.value.replace(/\D/g, '').slice(0, 2) })
                      }
                      className={field}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor={`ec-detail-${ec.id}`} className="label">
                    What you did. What changed.
                  </label>
                  <textarea
                    id={`ec-detail-${ec.id}`}
                    aria-label="What you did and what changed"
                    value={ec.detail}
                    maxLength={600}
                    rows={3}
                    placeholder="Be specific about your contribution, the outcome, and what you learned. Numbers help."
                    onChange={(e) => update(ec.id, { detail: e.target.value })}
                    className={`${field} resize-y leading-7`}
                  />
                  <p className="mt-1 text-right text-[10px] tabular-nums text-muted">
                    {ec.detail.length} / 600 characters
                  </p>
                </div>
              </fieldset>
            ))}
          </div>
          {ecs.length < MAX_ECS && (
            <button
              onClick={() => setEcs((l) => [...l, blank()])}
              className="btn-ghost w-full !border-dashed"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add another activity
            </button>
          )}
          {error && (
            <div role="alert" className="feedback-error flex items-start gap-2">
              <MessageSquareWarning className="mt-1 h-4 w-4" aria-hidden="true" />
              {error}
            </div>
          )}
          <div className="border-t border-line pt-5">
            <button onClick={rate} disabled={loading} className="btn-primary w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Reviewing your activities…
                </>
              ) : (
                <>
                  Rank my ECs
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <Save className="h-3 w-3" aria-hidden="true" />
              Your activity draft is kept on this device.
            </p>
          </div>
        </section>
        <div className="min-w-0 space-y-5 xl:sticky xl:top-28">
          <section
            className="panel min-w-0 p-5 sm:p-6"
            aria-live="polite"
            aria-busy={loading}
            aria-label="Activity review"
          >
            <p className="eyebrow">02 / A LITTLE PERSPECTIVE</p>
            {!result ? (
              <>
                <EmptyState
                  icon={Sparkles}
                  title={
                    loading ? 'Looking at the bigger picture…' : 'Your impact, in perspective.'
                  }
                >
                  {loading
                    ? 'Nova is reviewing the depth, responsibility and impact of your activities.'
                    : 'Add your experiences and request a review. Your ranking, strengths, and opportunities to grow will appear here.'}
                </EmptyState>
                <div className="rounded-xl bg-ink p-5">
                  <h3 className="text-sm font-semibold">Depth over a longer list.</h3>
                  <p className="mt-2 text-xs leading-6 text-muted">
                    A specific example of responsibility or change says more than a title. Include
                    what you actually did, and why it mattered.
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-5 space-y-6">
                <div>
                  <span
                    className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${TIER[result.overallLevel]}`}
                  >
                    Overall: {result.overallLevel}
                  </span>
                  <p className="mt-4 text-base leading-8 text-cream">{result.summary}</p>
                </div>
                <ol className="divide-y divide-line">
                  {result.ranked.map((r, i) => (
                    <li key={`${r.name}-${i}`} className="py-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 break-words text-base font-semibold">
                          <span className="mr-2 font-mono text-xs font-normal text-muted">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          {r.name}
                        </h3>
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold capitalize ${TIER[r.tier]}`}
                        >
                          {r.tier}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-muted">{r.why}</p>
                      <p className="mt-3 rounded-xl bg-ink p-4 text-sm leading-7 text-cream">
                        <span className="font-semibold text-accent">Make it count: </span>
                        {r.leverage}
                      </p>
                    </li>
                  ))}
                </ol>
                {result.gaps.length > 0 && (
                  <div className="rounded-xl bg-accent-deep/50 p-5">
                    <h3 className="text-sm font-semibold">Room to grow</h3>
                    <ul className="mt-3 list-disc space-y-3 pl-4 text-sm leading-7 text-muted">
                      {result.gaps.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
          <Notice>
            This review is a preparation aid, not an admissions decision. It reflects the
            experiences you describe and cannot predict how a university will assess your
            application.
          </Notice>
        </div>
      </div>
    </div>
  );
}
