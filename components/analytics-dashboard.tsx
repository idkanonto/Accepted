'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { computeStats, type Stats } from '@/lib/analytics';
import type { Attempt } from '@/lib/storage';
import { authFetch } from '@/lib/supabase/client';
import { useAuth } from './auth-provider';
import { ArrowRight, Loader2, Sparkles, Trash2 } from 'lucide-react';

type Summary = {
  summary: string;
  strengths: string[];
  focusAreas: string[];
  actions: string[];
};

type JobRow = {
  id: string;
  program: string;
  program_code: string;
  university: string;
  question: string;
  answer: string;
  status: string;
  score: number | null;
  verdict: string | null;
  strengths: string[] | null;
  fixes: string[] | null;
  rewrite: string | null;
  created_at: string;
};

function toAttempt(j: JobRow): Attempt {
  return {
    id: j.id,
    programCode: j.program_code,
    program: j.program,
    university: j.university,
    question: j.question,
    answer: j.answer,
    feedback: {
      score: j.score ?? 0,
      verdict: j.verdict ?? '',
      strengths: j.strengths ?? [],
      fixes: j.fixes ?? [],
      rewrite: j.rewrite ?? '',
    },
    createdAt: new Date(j.created_at).getTime(),
  };
}

export default function AnalyticsDashboard() {
  const { user, loading: authLoading, openAuth } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!user) {
      setAttempts([]);
      return;
    }
    try {
      const res = await authFetch('/api/analytics');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not load your history.');
        return;
      }
      const jobs = (data.jobs ?? []).filter((j: JobRow) => j.status === 'done');
      setAttempts(jobs.map(toAttempt));
    } catch {
      setError('Network error. Try again.');
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const stats: Stats | null = useMemo(
    () => (attempts ? computeStats(attempts) : null),
    [attempts]
  );

  async function askNova() {
    if (!stats) return;
    setLoadingSummary(true);
    setError(null);
    setSummary(null);
    try {
      const res = await authFetch('/api/summary', {
        method: 'POST',
        body: JSON.stringify({ stats }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not reach Nova.');
        return;
      }
      setSummary(data as Summary);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoadingSummary(false);
    }
  }

  async function clearHistory() {
    try {
      const res = await authFetch('/api/analytics', { method: 'DELETE' });
      if (res.ok) {
        setAttempts([]);
        setSummary(null);
      }
    } catch {
      setError('Could not clear history.');
    }
  }

  if (authLoading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (!user) {
    return (
      <div className="panel px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-cream">
          Sign in to see your analytics
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Your scores, progress, and Nova&apos;s breakdowns are saved to your account.
        </p>
        <button
          onClick={openAuth}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-accent-soft"
        >
          Sign in <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (attempts === null) {
    return <p className="text-sm text-muted">Loading your progress…</p>;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="panel px-6 py-16 text-center">
        <p className="font-display text-2xl font-semibold text-cream">No attempts yet</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Answer one supplemental question and Nova will start building your breakdown.
        </p>
        <Link
          href="/simulator"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-accent-soft"
        >
          Start practicing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const maxAvg = Math.max(...stats.perProgram.map((p) => p.avg), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow">Nova Analytics</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-cream">
            Your progress
          </h1>
          <p className="mt-1 text-sm text-muted">
            {stats.total} answer{stats.total === 1 ? '' : 's'} scored · average{' '}
            {stats.avgScore}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={askNova}
            disabled={loadingSummary}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-accent-soft disabled:opacity-60"
          >
            {loadingSummary ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loadingSummary ? 'Reading your record…' : 'Ask Nova for a breakdown'}
          </button>
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 rounded-lg border border-line bg-panel px-4 py-2.5 text-sm text-muted transition hover:text-rose"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="grid gap-px border border-line bg-line md:grid-cols-4">
        {[
          { label: 'Answers scored', value: String(stats.total) },
          { label: 'Average score', value: String(stats.avgScore) },
          { label: 'Best score', value: String(stats.bestScore) },
          {
            label: 'Weakest program',
            value: stats.weakest ? stats.weakest.program : '—',
          },
        ].map((s) => (
          <div key={s.label} className="bg-panel p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
              {s.label}
            </p>
            <p className="mt-2 font-display text-xl font-semibold text-cream">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="panel p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Score by program
          </h2>
          <div className="mt-5 space-y-4">
            {stats.perProgram.map((p) => (
              <div key={p.program}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-cream">{p.program}</span>
                  <span className="text-xs text-muted">
                    {p.count} · avg {p.avg}
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full bg-line">
                  <div
                    className={`h-full ${
                      p.avg >= 75 ? 'bg-accent' : p.avg >= 55 ? 'bg-gold' : 'bg-rose'
                    }`}
                    style={{ width: `${(p.avg / maxAvg) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Last 8 weeks
          </h2>
          <div className="mt-5 flex h-32 items-end gap-2">
            {stats.trend.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-24 w-full items-end bg-ink">
                  {w.avg !== null ? (
                    <div
                      className="w-full bg-gold"
                      style={{ height: `${Math.max(w.avg, 4)}%` }}
                      title={`${w.label}: ${w.avg}`}
                    />
                  ) : null}
                </div>
                <span className="text-[9px] text-muted">{w.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {error && (
        <div className="border-l-2 border-rose bg-rose/10 px-4 py-3 text-sm text-rose">
          {error}
        </div>
      )}

      {summary && (
        <section className="panel">
          <div className="border-b border-line p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-cream">
              <Sparkles className="h-5 w-5 text-accent-soft" /> Nova&apos;s breakdown
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/90">
              {summary.summary}
            </p>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold text-cream">Where you are strong</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-cream/90">
                {summary.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-cream">
                Where you are losing marks
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-cream/90">
                {summary.focusAreas.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-cream">Do next</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-cream/90">
                {summary.actions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      <section className="panel">
        <h2 className="border-b border-line p-6 text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Recent attempts
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-[0.14em] text-muted">
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Question</th>
                <th className="px-6 py-3 font-medium">Program</th>
                <th className="px-6 py-3 text-right font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {stats.recent.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-6 py-3 text-muted">
                    {new Date(a.createdAt).toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="max-w-md px-6 py-3">
                    <span className="line-clamp-1 text-cream/90">{a.question}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-muted">{a.program}</td>
                  <td className="px-6 py-3 text-right font-semibold text-cream">
                    {a.feedback.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
