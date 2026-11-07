'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

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
  const [sort, setSort] = useState<'average' | 'offers' | 'name'>('average');

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

  const rows = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const filtered = data.programs.filter(
      (p) =>
        (university === 'all' || p.university === university) &&
        (!q || p.program.toLowerCase().includes(q) || p.university.toLowerCase().includes(q))
    );
    return filtered.sort((a, b) =>
      sort === 'average'
        ? b.average - a.average || b.offers - a.offers
        : sort === 'offers'
          ? b.offers - a.offers || b.average - a.average
          : a.program.localeCompare(b.program)
    );
  }, [data, query, university, sort]);

  if (error) {
    return (
      <div className="panel p-10 text-center text-sm text-rose" role="alert">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel flex items-center justify-center gap-3 p-16 text-sm text-muted" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
        Loading historical averages…
      </div>
    );
  }

  const stats = [
    { label: 'Programs tracked', value: String(data.programCount) },
    { label: 'Offers recorded', value: data.totalOffers.toLocaleString() },
    { label: 'Overall admitted average', value: `${data.overallAverage}%` },
    { label: 'Universities', value: String(universities.length) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-panel p-5">
            <p className="eyebrow">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold text-cream">{s.value}</p>
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
              aria-label="Search programs and universities"
              placeholder="Search a program or university…"
              className="input pl-9"
            />
          </div>
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            aria-label="Filter by university"
            className="input md:w-56"
          >
            <option value="all">All universities</option>
            {universities.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort programs"
            className="input md:w-44"
          >
            <option value="average">Highest average</option>
            <option value="offers">Most offers</option>
            <option value="name">Program name</option>
          </select>
        </div>

        <p className="mt-3 text-xs leading-5 text-muted">
          {rows.length} program{rows.length === 1 ? '' : 's'} shown. Averages are the reported Top 6
          average of admitted applicants, from self-reported outcomes. They are a planning reference,
          not an admission guarantee.
        </p>

        <div className="mt-4 rounded-lg border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-16 z-10 bg-ink">
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="hidden whitespace-nowrap px-4 py-3 font-semibold sm:table-cell">University</th>
                <th className="px-4 py-3 font-semibold">Program</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Offers</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Average</th>
                <th className="hidden whitespace-nowrap px-4 py-3 text-right font-semibold md:table-cell">Range</th>
                <th className="hidden whitespace-nowrap px-4 py-3 text-center font-semibold lg:table-cell">Recent years</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={`${p.university}-${p.program}`} className="transition hover:bg-panel-2/50">
                  <td className="hidden whitespace-nowrap px-4 py-3 text-xs text-muted sm:table-cell">{p.university}</td>
                  <td className="px-4 py-3 font-medium text-cream">{p.program}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted">{p.offers}</td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-base font-semibold ${
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
                    No programs match “{query}”.
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
