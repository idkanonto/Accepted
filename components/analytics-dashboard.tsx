'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { computeStats, type Stats } from '@/lib/analytics';
import type { Attempt } from '@/lib/storage';
import { authFetch } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/track';
import { EmptyState, LoadingState, Notice, PageHeading } from './ui';
import Dialog from './dialog';
import { useAuth } from './auth-provider';
import {
  ArrowRight,
  ChartNoAxesCombined,
  Loader2,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';

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
  const [clearOpen, setClearOpen] = useState(false);

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

  const stats: Stats | null = useMemo(() => (attempts ? computeStats(attempts) : null), [attempts]);

  async function askNova() {
    if (!stats) return;
    trackEvent('breakdown_requested', { attempts: String(stats.total) });
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

  if (authLoading) return <LoadingState label="Opening your progress…" />;

  if (!user)
    return (
      <div className="panel">
        <EmptyState
          icon={ChartNoAxesCombined}
          title="Your practice, together in one place."
          action={
            <button onClick={openAuth} className="btn-primary">
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          }
        >
          Sign in to see your scores, progress, and Nova’s breakdowns saved to your account.
        </EmptyState>
      </div>
    );

  if (attempts === null)
    return error ? (
      <div className="panel p-6 sm:p-8">
        <div role="alert" className="feedback-error">
          {error}
        </div>
        <button
          onClick={() => {
            setError(null);
            void load();
          }}
          className="btn-ghost mt-5"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Try loading again
        </button>
      </div>
    ) : (
      <LoadingState label="Loading your practice record…" />
    );

  if (!stats || stats.total === 0)
    return (
      <div>
        <PageHeading
          eyebrow="REFLECT & IMPROVE / NOVA ANALYTICS"
          title="Every attempt is a step forward."
        >
          A place to see what’s working, find your next focus, and keep a little perspective.
        </PageHeading>
        <section className="panel">
          <EmptyState
            icon={ChartNoAxesCombined}
            title="Your progress starts with one response."
            action={
              <Link href="/simulator" className="btn-primary">
                Start practising
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            }
          >
            Answer a supplemental question and get feedback. Your scores, program comparisons, and
            practice trend will start taking shape here.
          </EmptyState>
        </section>
      </div>
    );

  const maxAvg = Math.max(...stats.perProgram.map((p) => p.avg), 1);

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="REFLECT & IMPROVE / NOVA ANALYTICS"
        title="Every attempt is a step forward."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={askNova} disabled={loadingSummary} className="btn-primary">
              {loadingSummary ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-4 w-4" aria-hidden="true" />
              )}
              {loadingSummary ? 'Reading your record…' : 'Ask Nova for a breakdown'}
            </button>
            <button
              onClick={() => setClearOpen(true)}
              className="icon-button !border !border-line !bg-panel"
              aria-label="Clear practice history"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        }
      >
        A place to see what’s working, find your next focus, and keep a little perspective.
      </PageHeading>
      <section className="data-strip" aria-label="Your practice overview">
        {[
          { label: 'Average practice score', value: String(stats.avgScore), primary: true },
          { label: 'Answers scored', value: String(stats.total) },
          { label: 'Best practice score', value: String(stats.bestScore) },
          {
            label: 'Program to focus on',
            value: stats.weakest ? stats.weakest.program : '—',
            text: true,
          },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-xs font-medium text-muted">{s.label}</p>
            <p
              className={`mt-3 ${s.text ? 'break-words text-lg font-semibold leading-snug tracking-tight text-cream' : `score-number ${s.primary ? 'text-accent' : 'text-cream'}`}`}
            >
              {s.value}
            </p>
            {s.primary && (
              <span className="text-[11px] text-muted">out of 100 · practice only</span>
            )}
          </div>
        ))}
      </section>
      {error && (
        <div role="alert" className="feedback-error">
          {error}
        </div>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="panel min-w-0 p-5 sm:p-6">
          <p className="eyebrow">01 / FIND YOUR FOCUS</p>
          <h2 className="section-heading mt-2">Practice by program</h2>
          <p className="mt-2 text-xs leading-6 text-muted">
            Average scores, relative to your highest program average.
          </p>
          <div className="mt-7 space-y-6">
            {stats.perProgram.map((p) => (
              <div key={p.program}>
                <div className="mb-2 flex items-start justify-between gap-5">
                  <span className="min-w-0 break-words text-sm font-medium leading-6">
                    {p.program}
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-cream">
                    {p.avg}
                    <span className="ml-2 text-[10px] font-normal text-muted">
                      {p.count} {p.count === 1 ? 'attempt' : 'attempts'}
                    </span>
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${p.program}: average practice score ${p.avg} out of 100, ${p.count} attempts`}
                  className="h-2.5 overflow-hidden rounded-full bg-panel-2"
                >
                  <div
                    className={`h-full rounded-full ${p.avg >= 75 ? 'bg-accent' : p.avg >= 55 ? 'bg-gold' : 'bg-rose'}`}
                    style={{ width: `${(p.avg / maxAvg) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel min-w-0 p-5 sm:p-6">
          <p className="eyebrow">02 / THE LONGER VIEW</p>
          <h2 className="section-heading mt-2">Your last eight weeks</h2>
          <p className="mt-2 text-xs leading-6 text-muted">
            Weekly average practice score, out of 100.
          </p>
          <div className="mt-8 flex items-end gap-2 sm:gap-3">
            {stats.trend.map((w, i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <span className="text-[10px] font-medium tabular-nums text-muted">
                  {w.avg ?? '—'}
                </span>
                <div
                  role="img"
                  aria-label={`${w.label}: ${w.avg !== null ? `average score ${w.avg} out of 100` : 'no practice recorded'}`}
                  className="flex h-32 w-full items-end overflow-hidden rounded-md bg-panel-2/60"
                >
                  {w.avg !== null && (
                    <div
                      className="w-full rounded-md bg-accent/80"
                      style={{ height: `${Math.max(w.avg, 4)}%` }}
                    />
                  )}
                </div>
                <span className="chart-label text-center leading-4">{w.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[11px] leading-5 text-muted">
            A dash means no scored attempts that week. Progress is more than a number; use feedback
            to guide your next response.
          </p>
        </section>
      </div>
      {loadingSummary && (
        <div role="status" className="panel flex items-center gap-4 p-6">
          <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
          <p className="text-sm text-muted">
            Nova is looking for patterns in your practice record…
          </p>
        </div>
      )}
      {summary && (
        <section className="panel overflow-hidden" aria-labelledby="nova-summary-title">
          <div className="border-b border-line bg-accent-deep/30 p-5 sm:p-6">
            <p className="eyebrow !text-accent">03 / TURN REFLECTION INTO ACTION</p>
            <h2 id="nova-summary-title" className="section-heading mt-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" aria-hidden="true" />
              Nova’s perspective
            </h2>
            <p className="mt-4 max-w-4xl text-base leading-8 text-cream">{summary.summary}</p>
          </div>
          <div className="grid gap-7 p-5 sm:p-6 md:grid-cols-3">
            {[
              { title: 'Your strengths', items: summary.strengths },
              { title: 'Where to focus', items: summary.focusAreas },
              { title: 'Your next steps', items: summary.actions },
            ].map((section, i) => (
              <div key={section.title}>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span className="number-label !h-6 !w-6">{i + 1}</span>
                  {section.title}
                </h3>
                <ul className="mt-4 list-disc space-y-3 pl-4 text-sm leading-7 text-muted">
                  {section.items.map((s, j) => (
                    <li key={j}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      <section className="panel min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-6 sm:px-6">
          <div>
            <p className="eyebrow">YOUR PRACTICE RECORD</p>
            <h2 className="section-heading mt-2">Recent attempts</h2>
          </div>
          <span className="chip">{stats.recent.length} recent</span>
        </div>
        <div className="divide-y divide-line md:hidden">
          {stats.recent.map((a) => (
            <article key={a.id} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="break-words text-xs font-medium leading-6 text-muted">
                    {a.program}
                  </p>
                  <p className="mt-1 text-[10px] text-muted">
                    {new Date(a.createdAt).toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-accent-deep px-2.5 py-1 text-base font-semibold tabular-nums text-accent">
                  {a.feedback.score}
                  <span className="ml-1 text-[10px] font-normal">/ 100</span>
                </span>
              </div>
              <p className="text-sm leading-7 text-cream">{a.question}</p>
            </article>
          ))}
        </div>
        <div
          className="table-scroll hidden md:block"
          tabIndex={0}
          aria-label="Recent attempts table"
        >
          <table className="folio-table min-w-[560px]">
            <caption>Recent scored practice attempts</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Question</th>
                <th scope="col">Program</th>
                <th scope="col" className="text-right">
                  Score
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap text-xs text-muted">
                    {new Date(a.createdAt).toLocaleDateString('en-CA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="max-w-md">
                    <span className="line-clamp-2 text-sm leading-6 text-cream" title={a.question}>
                      {a.question}
                    </span>
                  </td>
                  <td className="max-w-[200px] text-xs leading-6 text-muted">{a.program}</td>
                  <td className="text-right font-semibold tabular-nums text-accent">
                    {a.feedback.score}
                    <span className="ml-1 text-[10px] font-normal text-muted">/ 100</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Notice>
        Scores and AI feedback are practice aids, not admissions decisions or probabilities. Program
        averages and trends use your saved scored attempts.
      </Notice>
      <Dialog open={clearOpen} onClose={() => setClearOpen(false)} labelledBy="clear-history-title">
        <span className="icon-tile !bg-mortuum !text-rose">
          <Trash2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 id="clear-history-title" className="mt-5 text-xl font-semibold">
          Clear your practice history?
        </h2>
        <p className="mt-3 text-sm leading-7 text-muted">
          This removes your saved scored attempts and the progress shown here. This action cannot be
          undone.
        </p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button onClick={() => setClearOpen(false)} className="btn-ghost" autoFocus>
            Keep my history
          </button>
          <button
            onClick={() => {
              setClearOpen(false);
              void clearHistory();
            }}
            className="btn-danger"
          >
            Clear history
          </button>
        </div>
      </Dialog>
    </div>
  );
}
