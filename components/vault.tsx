'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { UNIVERSITIES } from '@/lib/data/programs';
import { readPlannerAverage } from '@/lib/position';
import { ProgramTags, RangeBar } from './program-signals';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Search,
  SearchX,
  SlidersHorizontal,
} from 'lucide-react';
import { trackEvent } from '@/lib/track';
import { EmptyState, Notice, PageHeading } from './ui';

export default function Vault() {
  const [uniKey, setUniKey] = useState<string>('waterloo');
  const [query, setQuery] = useState('');
  const [average, setAverage] = useState<number | null>(null);

  useEffect(() => setAverage(readPlannerAverage()), []);

  const university = UNIVERSITIES.find((u) => u.key === uniKey) ?? UNIVERSITIES[0];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return university.programs;
    return university.programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.req.toLowerCase().includes(q) ||
        p.deadline.toLowerCase().includes(q)
    );
  }, [university, query]);

  return (
    <div>
      <PageHeading eyebrow="DISCOVER & PLAN / PROGRAM VAULT" title="Find your next possibility.">
        Get to know Ontario programs, their supplemental requirements, and the details that make
        each application different.
      </PageHeading>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search programs and requirements"
            placeholder="Search programs, requirements, deadlines…"
            className="input !pl-10"
          />
        </div>
        <Link
          href="/planner"
          className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-accent"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {average == null ? 'Set your average in the Planner' : `Your saved average: ${average}%`}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
      <div className="vault-layout">
        <nav aria-label="Choose a university" className="university-index">
          <p className="eyebrow mb-3 hidden pl-3 md:block">UNIVERSITIES</p>
          {UNIVERSITIES.map((u, i) => (
            <button key={u.key} onClick={() => setUniKey(u.key)} aria-pressed={uniKey === u.key}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <span>{u.short}</span>
            </button>
          ))}
        </nav>
        <div className="min-w-0 space-y-5">
          <section className="panel overflow-hidden" aria-labelledby="university-heading">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/70 px-5 py-6 sm:px-6">
              <div>
                <p className="mb-1 text-xs text-muted">Programs with supplemental requirements</p>
                <h2 id="university-heading" className="section-heading">
                  {university.name}
                </h2>
              </div>
              <span className="chip" aria-live="polite">
                {rows.length} program{rows.length === 1 ? '' : 's'}
              </span>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="No programs found."
                action={
                  <button onClick={() => setQuery('')} className="btn-ghost">
                    Clear search
                  </button>
                }
              >
                No programs match “{query}” at {university.name}. Try another search or university.
              </EmptyState>
            ) : (
              <>
                <div className="divide-y divide-line md:hidden">
                  {rows.map((p) => (
                    <article key={p.name} className="p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold leading-snug">{p.name}</h3>
                        <span className="shrink-0 rounded-lg bg-accent-deep px-2.5 py-1 text-xs font-semibold text-accent">
                          {p.avg}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-muted">{p.req}</p>
                      <div className="my-5 max-w-xs">
                        <RangeBar label={p.avg} average={average} />
                      </div>
                      <ProgramTags req={p.req} />
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {p.deadline}
                        </span>
                        <Link
                          href={`/simulator?program=${p.code}`}
                          onClick={() =>
                            trackEvent('practice_clicked', { code: p.code, program: p.name })
                          }
                          className="btn-ghost !min-h-10 !px-3 !text-xs"
                        >
                          Practise prompt
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
                <div className="table-scroll hidden md:block">
                  <table className="folio-table vault-table">
                    <caption>
                      {university.name} supplemental requirements and estimated competitive averages
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Program</th>
                        <th scope="col">Reference average</th>
                        <th scope="col">What to prepare</th>
                        <th scope="col">Deadline</th>
                        <th scope="col">
                          <span className="sr-only">Practice action</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((p) => (
                        <tr key={p.name}>
                          <td className="program-name">{p.name}</td>
                          <td className="program-average">
                            <span className="text-base font-semibold tabular-nums text-accent">
                              {p.avg}
                            </span>
                            <div className="mt-3">
                              <RangeBar label={p.avg} average={average} />
                            </div>
                          </td>
                          <td className="program-detail">
                            <p className="mb-3 text-xs leading-6 text-muted">{p.req}</p>
                            <ProgramTags req={p.req} />
                          </td>
                          <td>
                            <span className="whitespace-nowrap text-xs font-medium text-muted">
                              {p.deadline}
                            </span>
                          </td>
                          <td className="!pl-0">
                            <Link
                              href={`/simulator?program=${p.code}`}
                              aria-label={`Practise ${p.name}`}
                              onClick={() =>
                                trackEvent('practice_clicked', { code: p.code, program: p.name })
                              }
                              className="icon-button !text-accent"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
          <Notice>
            These are planning references, not official admission guarantees. Competitive averages,
            requirements and deadlines may change. Verify each detail with the university.{' '}
            {average != null
              ? 'The ink marker shows your saved average on the reference range.'
              : 'Set your average in the Planner to see your position on each reference range.'}
          </Notice>
          <Link
            href="/planner"
            className="inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            Found something that fits? Add it to your shortlist in the Planner.
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
