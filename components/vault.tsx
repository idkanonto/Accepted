'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { UNIVERSITIES } from '@/lib/data/programs';
import { ArrowRight, Search } from 'lucide-react';

export default function Vault() {
  const [uniKey, setUniKey] = useState<string>('waterloo');
  const [query, setQuery] = useState('');

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow">Program Vault</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-cream md:text-3xl">
            Ontario Supplemental Program Guide
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Select a university below to browse all programs requiring supplemental
            applications, competitive averages, and deadlines. These are planning
            references, not official admission guarantees; verify each detail with the university.
          </p>
        </div>
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search programs and requirements"
              placeholder="Search program name..."
              className="w-full rounded-lg border border-line bg-ink py-2.5 pl-9 pr-3 text-sm text-cream outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {UNIVERSITIES.map((u) => (
          <button
            key={u.key}
            onClick={() => setUniKey(u.key)}
            aria-pressed={uniKey === u.key}
            className={`rounded-xl px-3 py-3 text-xs font-medium transition ${
              uniKey === u.key
                ? 'bg-accent text-ink shadow'
                : 'border border-line bg-panel text-muted hover:text-cream'
            }`}
          >
            {u.short}
          </button>
        ))}
      </div>

      <div className="panel mt-4 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-ink/50 p-4 sm:p-5">
          <h2 className="text-lg font-bold text-cream">
            {university.name} — Programs with Supplemental Requirements
          </h2>
          <span className="rounded-full border border-accent/40 bg-accent-deep/20 px-3 py-1 text-xs font-medium text-accent-soft">
            {rows.length} Program{rows.length === 1 ? '' : 's'} Listed
          </span>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {rows.map((program) => (
            <article key={program.name} className="rounded-xl border border-line bg-ink/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-cream">{program.name}</h3>
                <span className="shrink-0 rounded-md bg-accent-deep px-2 py-1 text-xs font-semibold text-accent">
                  {program.avg}
                </span>
              </div>
              <p className="mt-3 text-sm leading-5 text-muted">{program.req}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-medium text-gold">Deadline: {program.deadline}</span>
                <Link
                  href={`/simulator?program=${program.code}`}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line bg-panel px-3 text-xs font-semibold text-accent transition hover:border-accent/50"
                >
                  Practice prompt <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </article>
          ))}
          {rows.length === 0 && (
            <p className="p-8 text-center text-sm text-muted">No programs match “{query}”.</p>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <th className="whitespace-nowrap p-4 font-semibold">Program Name</th>
                <th className="whitespace-nowrap p-4 font-semibold">Est. Competitive Average</th>
                <th className="p-4 font-semibold">Supp App Requirements &amp; Format</th>
                <th className="whitespace-nowrap p-4 font-semibold">Deadline</th>
                <th className="whitespace-nowrap p-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.name} className="text-cream/90 transition hover:bg-panel-2/60">
                  <td className="p-4 font-medium text-cream">{p.name}</td>
                  <td className="p-4">
                    <span className="rounded-md border border-accent/40 bg-accent-deep/20 px-2.5 py-1 font-semibold text-accent-soft">
                      {p.avg}
                    </span>
                  </td>
                  <td className="max-w-md p-4 text-xs text-muted">{p.req}</td>
                  <td className="whitespace-nowrap p-4 font-mono text-xs text-gold">
                    {p.deadline}
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/simulator?program=${p.code}`}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-ink px-3 py-1.5 text-xs font-medium text-accent-soft transition hover:border-accent/50"
                    >
                      Practice Prompt <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-muted">
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
