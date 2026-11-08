'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Check, ExternalLink, Plus, Save, Trash2 } from 'lucide-react';
import { UNIVERSITIES } from '@/lib/data/programs';
import { PLANNER_KEY, academicPosition, readEcLevel, type EcLevel } from '@/lib/position';
import { EcFit, ProgramTags, RangeBar } from './program-signals';
import HistoryPanel from './history-panel';
import { EmptyState, Notice, PageHeading } from './ui';
import { trackEvent } from '@/lib/track';

type PlannedProgram = {
  id: string;
  university: string;
  name: string;
  avg: string;
  req: string;
  deadline: string;
  code: string;
};

type PlannerState = {
  average: number;
  selected: PlannedProgram[];
  completed: string[];
};

const STORAGE_KEY = PLANNER_KEY;
const CHECKLIST = [
  'Confirm each program and campus on OUAC',
  'Check each university portal and supplemental requirements',
  'Add verified deadlines to your calendar',
  'Submit OUAC choices and review the confirmation',
  'Check portals regularly for updates or new tasks',
];

const PROGRAM_OPTIONS = UNIVERSITIES.flatMap((university) =>
  university.programs.map((program, index) => ({
    id: `${university.key}-${index}-${program.name}`,
    university: university.name,
    ...program,
  }))
);

type Tab = 'plan' | 'history';

function isPlannedProgram(value: unknown): value is PlannedProgram {
  if (!value || typeof value !== 'object') return false;
  const program = value as Record<string, unknown>;
  return (
    typeof program.id === 'string' &&
    typeof program.university === 'string' &&
    typeof program.name === 'string' &&
    typeof program.avg === 'string' &&
    typeof program.req === 'string' &&
    typeof program.deadline === 'string' &&
    typeof program.code === 'string'
  );
}

export default function Planner() {
  const [tab, setTab] = useState<Tab>('plan');
  const [average, setAverage] = useState(85);
  const [selected, setSelected] = useState<PlannedProgram[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [choice, setChoice] = useState('');
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [ecLevel, setEcLevel] = useState<EcLevel | null>(null);
  const lastTrackedAverage = useRef<number | null>(null);

  useEffect(() => setEcLevel(readEcLevel()), []);

  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) return;
      const state = JSON.parse(savedState) as Partial<PlannerState>;
      if (typeof state.average === 'number' && state.average >= 0 && state.average <= 100) {
        setAverage(state.average);
      }
      if (Array.isArray(state.selected)) setSelected(state.selected.filter(isPlannedProgram));
      if (Array.isArray(state.completed)) {
        setCompleted(
          state.completed.filter(
            (task): task is string => typeof task === 'string' && CHECKLIST.includes(task)
          )
        );
      }
    } catch {
      setStorageError('Could not read the saved planner from this browser.');
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        setStorageError('Browser storage is unavailable; your planner may not persist.');
      }
    }
  }, []);

  useEffect(() => {
    if (!saved) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ average, selected, completed } satisfies PlannerState)
      );
      setStorageError(null);
    } catch {
      setStorageError('Browser storage is unavailable; your planner may not persist.');
    }
  }, [average, selected, completed, saved]);

  const remaining = useMemo(() => CHECKLIST.length - completed.length, [completed]);

  function addProgram() {
    const program = PROGRAM_OPTIONS.find((option) => option.id === choice);
    if (!program || selected.some((item) => item.id === program.id)) return;
    setSelected((current) => [...current, program]);
    setSaved(true);
    trackEvent('program_added', { code: program.code });
  }

  function toggleTask(task: string) {
    setCompleted((current) =>
      current.includes(task) ? current.filter((item) => item !== task) : [...current, task]
    );
    setSaved(true);
  }

  function updateAverage(value: string) {
    const next = Number(value);
    if (Number.isFinite(next) && next >= 0 && next <= 100) {
      setAverage(next);
      setSaved(true);
      if (lastTrackedAverage.current === null || Math.abs(next - lastTrackedAverage.current) >= 5) {
        lastTrackedAverage.current = next;
        trackEvent('average_set', { average: String(next) });
      }
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'plan', label: 'My plan' },
    { id: 'history', label: 'Historical averages' },
  ];

  return (
    <div>
      <PageHeading eyebrow="DISCOVER & PLAN / OUAC PLANNER" title="Make your next move clear.">
        Your choices, your average, and the steps between here and your application. Start a
        shortlist and build from there.
      </PageHeading>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Planner sections" className="segmented">
          {tabs.map((t) => (
            <button
              key={t.id}
              aria-pressed={tab === t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === 'history') trackEvent('history_tab_viewed');
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-muted">
          <Save className="h-3.5 w-3.5" aria-hidden="true" />
          Saved privately on this device
        </p>
      </div>
      {tab === 'history' ? (
        <HistoryPanel />
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
          <div className="min-w-0 space-y-6">
            <section className="panel p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">01 / YOUR DIRECTION</p>
                  <h2 className="section-heading mt-2">The program shortlist</h2>
                </div>
                <span className="chip">
                  {selected.length} program{selected.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">
                Keep the possibilities you want to explore a little further.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="min-w-0 flex-1">
                  <label className="label" htmlFor="planner-program">
                    Add a university program
                  </label>
                  <select
                    id="planner-program"
                    value={choice}
                    onChange={(event) => setChoice(event.target.value)}
                    className="input"
                  >
                    <option value="">Choose a program…</option>
                    {UNIVERSITIES.map((university) => (
                      <optgroup key={university.key} label={university.name}>
                        {PROGRAM_OPTIONS.filter(
                          (program) => program.university === university.name
                        ).map((program) => (
                          <option key={program.id} value={program.id}>
                            {program.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <button
                  onClick={addProgram}
                  disabled={!choice || selected.some((program) => program.id === choice)}
                  className="btn-primary shrink-0 sm:self-end"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add program
                </button>
              </div>
            </section>
            {selected.length === 0 ? (
              <div className="panel">
                <EmptyState icon={BookOpen} title="Room for your possibilities.">
                  Add a program above to compare its requirements with your current average. Your
                  shortlist stays private in this browser.
                </EmptyState>
              </div>
            ) : (
              <div className="space-y-4">
                {selected.map((program, index) => {
                  const position = academicPosition(average, program.avg);
                  return (
                    <article key={program.id} className="panel p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="number-label mt-1">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs text-muted">{program.university}</p>
                            <h3 className="mt-1 text-lg font-semibold leading-snug">
                              {program.name}
                            </h3>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelected((current) =>
                              current.filter((item) => item.id !== program.id)
                            );
                            setSaved(true);
                            trackEvent('program_removed', { code: program.code });
                          }}
                          aria-label={`Remove ${program.name}`}
                          className="icon-button shrink-0 hover:!text-rose"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 rounded-xl bg-ink p-4 sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] text-muted">Reference average</p>
                          <p className="mt-1 text-sm font-semibold tabular-nums">{program.avg}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted">Deadline reference</p>
                          <p className="mt-1 text-sm font-semibold">{program.deadline}</p>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <p className="text-[11px] text-muted">Academic alignment</p>
                          <p
                            className={`mt-1 text-sm font-semibold ${position?.tone ?? 'text-muted'}`}
                          >
                            {position?.title ?? 'Check current requirements'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-5">
                        <RangeBar label={program.avg} average={average} />
                        <ProgramTags req={program.req} />
                      </div>
                      {position && (
                        <p className="mt-4 text-xs leading-6 text-muted">
                          {position.description} Listed requirements: {program.req}
                        </p>
                      )}
                      <div className="mt-3">
                        <EcFit req={program.req} level={ecLevel} />
                      </div>
                      <Link
                        href={`/simulator?program=${program.code}`}
                        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-accent"
                      >
                        Practise this application
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
            <Notice>
              Academic alignment is a guide, not an admission probability. Competitive averages are
              estimates and do not account for applicant pools, prerequisites, contextual review or
              supplemental performance.
            </Notice>
          </div>
          <aside className="min-w-0 space-y-6">
            <section className="panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">02 / YOUR STARTING POINT</p>
                  <h2 className="mt-2 text-base font-semibold">Admission average</h2>
                </div>
                <span className="text-3xl font-semibold tabular-nums tracking-tight text-accent">
                  {average}
                  <span className="text-base">%</span>
                </span>
              </div>
              <label htmlFor="current-average" className="mt-4 block text-xs leading-5 text-muted">
                Adjust your current average to see where it sits on each program’s reference range.
              </label>
              <input
                id="current-average"
                type="range"
                min="50"
                max="100"
                step="1"
                value={average}
                onChange={(event) => updateAverage(event.target.value)}
                className="mt-4 h-8 w-full accent-accent"
              />
              <div className="flex justify-between text-[11px] tabular-nums text-muted">
                <span>50%</span>
                <span>100%</span>
              </div>
            </section>
            <section className="panel p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow">03 / KEEP THINGS MOVING</p>
                  <h2 className="section-heading mt-2">Your next steps</h2>
                </div>
                <span className="chip">{remaining} left</span>
              </div>
              <div
                role="progressbar"
                aria-label="Application checklist completion"
                aria-valuenow={completed.length}
                aria-valuemin={0}
                aria-valuemax={CHECKLIST.length}
                className="mt-5 h-1.5 overflow-hidden rounded-full bg-panel-2"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(completed.length / CHECKLIST.length) * 100}%` }}
                />
              </div>
              <div className="mt-4 space-y-1">
                {CHECKLIST.map((task, taskIndex) => {
                  const done = completed.includes(task);
                  return (
                    <button
                      key={task}
                      onClick={() => {
                        trackEvent('checklist_toggled', {
                          task_index: String(taskIndex),
                          done: String(!done),
                        });
                        toggleTask(task);
                      }}
                      aria-pressed={done}
                      className="flex min-h-12 w-full items-start gap-3 rounded-xl py-3 text-left transition-colors hover:bg-ink"
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${done ? 'border-accent bg-accent text-white' : 'border-slate/40 bg-panel'}`}
                      >
                        {done && <Check className="h-3 w-3" aria-hidden="true" />}
                      </span>
                      <span
                        className={`text-xs leading-6 ${done ? 'text-muted line-through' : 'text-cream'}`}
                      >
                        {task}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p
                aria-live="polite"
                className={`mt-4 border-t border-line pt-4 text-[11px] leading-5 ${storageError ? 'text-rose' : 'text-muted'}`}
              >
                {storageError ??
                  (saved
                    ? 'Your updates are saved on this device.'
                    : 'Changes save automatically.')}
              </p>
            </section>
            <section className="px-2">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-cream">
                <ExternalLink className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Go to the source
              </p>
              <p className="text-xs leading-6 text-muted">
                Requirements change. Confirm each program, deadline and prerequisite in the official
                portals before submitting.
              </p>
              <a
                href="https://www.ouac.on.ca/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-accent"
              >
                Visit OUAC
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
