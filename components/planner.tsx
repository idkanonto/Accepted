'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Circle, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { UNIVERSITIES } from '@/lib/data/programs';

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

const STORAGE_KEY = 'accepted-application-planner-v1';
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

function averageRange(label: string): [number, number] | null {
  const values = label.match(/\d{2}/g)?.map(Number);
  if (!values?.length) return null;
  if (label.includes('+')) return [values[0], values[0]];
  if (values.length > 1) return [values[0], values[1]];
  return [values[0], values[0]];
}

function academicPosition(average: number, label: string) {
  const range = averageRange(label);
  if (!range) return null;
  const [low, high] = range;
  if (average >= high) {
    return {
      title: 'Above the listed reference range',
      description: 'Your current average is above this broad reference point.',
      tone: 'text-accent',
      distance: 0,
    };
  }
  if (average >= low - 2) {
    return {
      title: 'Near the listed reference range',
      description: 'Your current average is close to this broad reference point.',
      tone: 'text-gold',
      distance: Math.max(0, high - average),
    };
  }
  return {
    title: 'Below the listed reference range',
    description: 'Your current average is below this broad reference point.',
    tone: 'text-rose',
    distance: low - average,
  };
}

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
  const [average, setAverage] = useState(85);
  const [selected, setSelected] = useState<PlannedProgram[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [choice, setChoice] = useState('');
  const [saved, setSaved] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

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

  const remaining = useMemo(
    () => CHECKLIST.length - completed.length,
    [completed]
  );

  function addProgram() {
    const program = PROGRAM_OPTIONS.find((option) => option.id === choice);
    if (!program || selected.some((item) => item.id === program.id)) return;
    setSelected((current) => [...current, program]);
    setSaved(true);
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
    }
  }

  return (
    <div className="space-y-8">
      <header className="max-w-3xl">
        <p className="eyebrow">OUAC &amp; application planning</p>
        <h1 className="mt-3 text-3xl font-medium leading-tight text-cream sm:text-4xl">
          Keep the moving parts in one place.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
          Organize program choices, compare your current average with broad reference
          ranges, and keep track of the next steps you have verified.
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
        <section className="panel p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">My program shortlist</p>
              <h2 className="mt-2 text-2xl font-medium text-cream">Build your list</h2>
            </div>
            <span className="rounded-full bg-accent-deep px-3 py-1 text-xs font-semibold text-accent">
              Saved on this device
            </span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <label className="sr-only" htmlFor="planner-program">
              Choose a university program
            </label>
            <select
              id="planner-program"
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
              className="min-h-12 min-w-0 rounded-xl border border-line bg-panel px-3 text-sm text-cream"
            >
              <option value="">Choose a program to add…</option>
              {UNIVERSITIES.map((university) => (
                <optgroup key={university.key} label={university.name}>
                  {PROGRAM_OPTIONS.filter((program) => program.university === university.name).map(
                    (program) => (
                      <option key={program.id} value={program.id}>
                        {program.name}
                      </option>
                    )
                  )}
                </optgroup>
              ))}
            </select>
            <button
              onClick={addProgram}
              disabled={!choice || selected.some((program) => program.id === choice)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-ink transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add program
            </button>
          </div>

          <div className="mt-6">
            {selected.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line px-5 py-10 text-center">
                <p className="text-sm font-medium text-cream">Your shortlist is ready to start</p>
                <p className="mt-1 text-sm text-muted">
                  Add the programs you are considering. Your list stays private in this browser.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selected.map((program) => {
                  const position = academicPosition(average, program.avg);
                  return (
                    <article
                      key={program.id}
                      className="rounded-xl border border-line bg-ink/60 p-4 sm:p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-muted">{program.university}</p>
                          <h3 className="mt-1 text-lg font-medium text-cream">{program.name}</h3>
                        </div>
                        <button
                          onClick={() => {
                            setSelected((current) => current.filter((item) => item.id !== program.id));
                            setSaved(true);
                          }}
                          aria-label={`Remove ${program.name}`}
                          className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-panel hover:text-rose"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                            Listed average
                          </p>
                          <p className="mt-1 text-sm font-semibold text-cream">{program.avg}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                            Deadline reference
                          </p>
                          <p className="mt-1 text-sm font-semibold text-cream">{program.deadline}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                            Academic position
                          </p>
                          <p className={`mt-1 text-sm font-semibold ${position?.tone ?? 'text-muted'}`}>
                            {position?.title ?? 'Check current requirements'}
                          </p>
                        </div>
                      </div>
                      {position && (
                        <p className="mt-3 text-xs leading-5 text-muted">
                          {position.description} Listed requirements: {program.req}
                        </p>
                      )}
                      <Link
                        href={`/simulator?program=${program.code}`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
                      >
                        Practise this application <ArrowRight className="h-4 w-4" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <label
              htmlFor="current-average"
              className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-cream"
            >
              Current admission average
              <span className="font-display text-xl text-accent">{average}%</span>
            </label>
            <input
              id="current-average"
              type="range"
              min="50"
              max="100"
              step="1"
              value={average}
              onChange={(event) => updateAverage(event.target.value)}
              className="mt-3 w-full accent-[#d5b893]"
            />
            <div className="flex justify-between text-[11px] text-muted">
              <span>50%</span><span>100%</span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              This is an academic alignment guide, not an admission probability. Competitive
              averages are estimates and do not account for applicant pools, prerequisites,
              contextual review or supplemental performance.
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="panel p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow">Application checklist</p>
                <h2 className="mt-2 text-xl font-medium text-cream">Your next steps</h2>
              </div>
              <span className="rounded-lg bg-accent-deep px-2.5 py-1.5 text-xs font-semibold text-accent">
                {remaining} left
              </span>
            </div>
            <div className="mt-5 space-y-1">
              {CHECKLIST.map((task) => {
                const done = completed.includes(task);
                return (
                  <button
                    key={task}
                    onClick={() => toggleTask(task)}
                    aria-pressed={done}
                    className="flex w-full items-start gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-ink"
                  >
                    {done ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                    )}
                    <span className={`text-sm leading-5 ${done ? 'text-muted line-through' : 'text-cream'}`}>
                      {task}
                    </span>
                  </button>
                );
              })}
            </div>
            <p aria-live="polite" className={`mt-3 text-xs ${storageError ? 'text-rose' : 'text-muted'}`}>
              {storageError ?? (saved ? 'Your updates are saved on this device.' : 'Changes save automatically.')}
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-accent-deep/60 p-5 sm:p-6">
            <p className="eyebrow">Use verified information</p>
            <h2 className="mt-2 text-xl font-medium text-cream">Double-check every detail.</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Program requirements can change from year to year. Confirm your selection,
              deadline and prerequisites in the official portals before submitting.
            </p>
            <a
              href="https://www.ouac.on.ca/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
            >
              Visit OUAC <ExternalLink className="h-4 w-4" />
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
