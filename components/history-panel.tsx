'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Search, SearchX } from 'lucide-react';
import { EmptyState, LoadingState } from './ui';
import { trackEvent } from '@/lib/track';

type HistoryYear = { year: number; average: number; offers: number };
type HistoryProgram = {
  university: string;
  program: string;
  offers: number;
  average: number;
  median: number;
  low: number;
  high: number;
  byYear: HistoryYear[];
};
type SortKey = 'university' | 'program' | 'offers' | 'average';

type Payload = {
  totalOffers: number;
  overallAverage: number;
  programCount: number;
  programs: HistoryProgram[];
};

export default function HistoryPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [university, setUniversity] = useState('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({
    key: 'average',
    dir: 'desc',
  });

  useEffect(() => {
    fetch('/history.json')
      .then((res) => {
        if (!res.ok) throw new Error('bad response');
        return res.json();
      })
      .then((json: Payload) => setData(json))
      .catch(() => setError('Could not load the historical averages. Try again later.'));
  }, []);

  const universities = useMemo(
    () => (data ? [...new Set(data.programs.map((p) => p.university))].sort() : []),
    [data]
  );

  function toggleSort(key: SortKey) {
    const next: { key: SortKey; dir: 'asc' | 'desc' } = {
      key,
      dir:
        sort.key === key
          ? sort.dir === 'asc'
            ? 'desc'
            : 'asc'
          : key === 'university' || key === 'program'
            ? 'asc'
            : 'desc',
    };
    trackEvent('history_sort_changed', { key, dir: next.dir });
    setSort(next);
  }

  const sortHeader = (key: SortKey, label: string, className = '') => (
    <th
      scope="col"
      aria-sort={sort.key === key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
      className={className}
    >
      <button
        onClick={() => toggleSort(key)}
        className="inline-flex min-h-11 items-center gap-2 rounded-md text-xs font-medium hover:text-accent"
        aria-label={`Sort by ${label.toLowerCase()}`}
      >
        {label}
        <span className="inline-block w-3 text-accent" aria-hidden="true">
          {sort.key === key ? (
            sort.dir === 'asc' ? (
              '↑'
            ) : (
              '↓'
            )
          ) : (
            <ArrowDownUp className="h-3 w-3 text-muted/60" />
          )}
        </span>
      </button>
    </th>
  );

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const filtered = data.programs.filter(
      (p) =>
        (university === 'all' || p.university === university) &&
        (!q || p.program.toLowerCase().includes(q) || p.university.toLowerCase().includes(q))
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return filtered.sort((a, b) => {
      if (sort.key === 'university') {
        return a.university.localeCompare(b.university) * dir || a.program.localeCompare(b.program);
      }
      if (sort.key === 'program') return a.program.localeCompare(b.program) * dir;
      if (sort.key === 'offers') return (a.offers - b.offers) * dir || b.average - a.average;
      return (a.average - b.average) * dir || b.offers - a.offers;
    });
  }, [data, query, university, sort]);

  if (error) {
    return (
      <div className="feedback-error p-8 text-center" role="alert">
        {error}
      </div>
    );
  }

  if (!data) return <LoadingState label="Loading historical averages…" />;

  const stats = [
    { label: 'Programs tracked', value: String(data.programCount) },
    { label: 'Offers recorded', value: data.totalOffers.toLocaleString() },
    { label: 'Overall admitted average', value: `${data.overallAverage}%` },
    { label: 'Universities', value: String(universities.length) },
  ];

  return (
    <div className="space-y-6">
      <div className="data-strip">
        {stats.map((s) => (
          <div key={s.label} className="bg-panel p-5">
            <p className="eyebrow">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-cream">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onBlur={(e) =>
                trackEvent('history_searched', {
                  query: e.target.value,
                  results: String(rows.length),
                })
              }
              aria-label="Search programs and universities"
              placeholder="Search a program or university…"
              className="input !pl-10"
            />
          </div>
          <select
            value={university}
            onChange={(e) => {
              setUniversity(e.target.value);
              trackEvent('history_filter_changed', { university: e.target.value });
            }}
            aria-label="Filter by university"
            className="input md:w-60"
          >
            <option value="all">All universities</option>
            {universities.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <p className="mt-4 text-xs leading-6 text-muted" aria-live="polite">
          {rows.length} program{rows.length === 1 ? '' : 's'} shown. Averages are the reported Top 6
          average of admitted applicants, from self-reported outcomes. They are a planning
          reference, not an admission guarantee.
        </p>

        <div
          className="table-scroll mt-5 rounded-xl border border-line"
          tabIndex={0}
          aria-label="Historical admission averages table"
        >
          <table className="folio-table min-w-[300px]">
            <caption>
              Self-reported historical admission averages. Column buttons sort the results.
            </caption>
            <thead className="bg-ink">
              <tr className="border-b border-line text-left text-xs text-muted">
                {sortHeader('university', 'University', 'hidden sm:table-cell')}
                {sortHeader('program', 'Program')}
                {sortHeader('offers', 'Offers', 'text-right')}
                {sortHeader('average', 'Average', 'text-right')}
                <th className="hidden whitespace-nowrap px-4 py-3 text-right font-semibold md:table-cell">
                  Range
                </th>
                <th className="hidden whitespace-nowrap px-4 py-3 text-center font-semibold lg:table-cell">
                  Recent years
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={`${p.university}-${p.program}`} className="transition hover:bg-panel-2/50">
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted sm:table-cell">
                    {p.university}
                  </td>
                  <td className="!px-3 !py-4 font-medium text-cream">{p.program}</td>
                  <td className="!px-3 !py-4 text-right font-mono text-xs text-muted">
                    {p.offers}
                  </td>
                  <td
                    className={`!px-3 !py-4 text-right font-mono text-sm font-semibold ${
                      p.offers < 5
                        ? 'text-muted underline decoration-dotted decoration-muted/60 underline-offset-4'
                        : 'text-accent'
                    }`}
                    title={
                      p.offers < 5
                        ? `Based on ${p.offers} reported offer${p.offers === 1 ? '' : 's'} — a small sample`
                        : `Based on ${p.offers} reported offers`
                    }
                  >
                    {p.average.toFixed(1)}%
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-xs text-muted md:table-cell">
                    {p.low.toFixed(1)}%–{p.high.toFixed(1)}%
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-center font-mono text-xs text-muted lg:table-cell">
                    {p.byYear
                      .slice(-3)
                      .map((y) => `${y.year} ${y.average.toFixed(1)}`)
                      .join('  ·  ') || '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    <EmptyState
                      icon={SearchX}
                      title="No matching records."
                      action={
                        <button
                          className="btn-ghost"
                          onClick={() => {
                            setQuery('');
                            setUniversity('all');
                          }}
                        >
                          Reset filters
                        </button>
                      }
                    >
                      No historical programs match “{query}”. Try another program or university.
                    </EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
