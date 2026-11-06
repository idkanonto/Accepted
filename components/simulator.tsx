'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  SIMULATOR_PROGRAMS,
  PROGRAM_GROUPS,
  getSimulatorProgram,
} from '@/lib/data/prompts';
import { authFetch } from '@/lib/supabase/client';
import { useAuth } from './auth-provider';
import ScoreRing from './score-ring';
import {
  ArrowRight,
  Check,
  GraduationCap,
  Loader2,
  MessageSquareWarning,
  RotateCcw,
  Video,
} from 'lucide-react';

type Format = 'video' | 'written';
type Phase = 'idle' | 'prep' | 'response' | 'waiting' | 'feedback' | 'done';

const FORMATS: Record<Format, { label: string; prep: number; response: number }> = {
  video: { label: 'Video Response (30s prep / 2 min record)', prep: 30, response: 120 },
  written: { label: 'Written Reflection / AIF Essay (60s prep / 10 min write)', prep: 60, response: 600 },
};

type Feedback = {
  score: number;
  verdict: string;
  strengths: string[];
  fixes: string[];
  rewrite: string;
};

export default function Simulator() {
  const params = useSearchParams();
  const { user, loading: authLoading, openAuth } = useAuth();

  const [programCode, setProgramCode] = useState<string>('queens_comm');
  const [format, setFormat] = useState<Format>('video');
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [capReached, setCapReached] = useState(false);

  const program = getSimulatorProgram(programCode) ?? SIMULATOR_PROGRAMS[0];

  useEffect(() => {
    const p = params.get('program');
    if (p && getSimulatorProgram(p)) setProgramCode(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Countdown
  useEffect(() => {
    if (phase !== 'prep' && phase !== 'response') return;
    const id = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Time-up handling
  useEffect(() => {
    if (timeLeft > 0) return;
    if (phase === 'prep') {
      setPhase('response');
      setTimeLeft(FORMATS[format].response);
    } else if (phase === 'response') {
      handleTimeUp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, format]);

  // Poll the queue until Nova finishes
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const res = await authFetch(`/api/jobs/${jobId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (stopped) return;
        setQueuePosition(typeof data.position === 'number' ? data.position : null);
        setCapReached(Boolean(data.capReached));

        if (data.status === 'done') {
          setFeedback({
            score: data.score,
            verdict: data.verdict,
            strengths: data.strengths ?? [],
            fixes: data.fixes ?? [],
            rewrite: data.rewrite,
          });
          setPhase('feedback');
          if (timer) clearInterval(timer);
        } else if (data.status === 'failed') {
          setError(data.error ?? 'Evaluation failed. Please try again.');
          setPhase('response');
          if (timer) clearInterval(timer);
        }
      } catch {
        // transient network error — next tick retries
      }
    };

    tick();
    timer = setInterval(tick, 3000);
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [jobId]);

  function startSimulation() {
    const prompts = program.prompts;
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    setAnswer('');
    setFeedback(null);
    setError(null);
    setJobId(null);
    setQueuePosition(null);
    setCapReached(false);
    setPhase('prep');
    setTimeLeft(FORMATS[format].prep);
  }

  function progressSimulation() {
    if (phase === 'prep') {
      setPhase('response');
      setTimeLeft(FORMATS[format].response);
    } else if (phase === 'response') {
      submit();
    }
  }

  function handleTimeUp() {
    if (format === 'written' && answer.trim().length >= 20) {
      submit();
    } else if (format === 'written') {
      setError('Time is up. Write at least a sentence or two, then submit.');
    } else {
      setPhase('done');
    }
  }

  async function submit() {
    if (answer.trim().length < 20) {
      setError('Write at least a sentence or two before asking for a score.');
      return;
    }
    if (authLoading) return;
    if (!user) {
      openAuth();
      return;
    }
    setError(null);
    setPhase('waiting');
    try {
      const res = await authFetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          question: prompt,
          answer: answer.trim(),
          program: program.label,
          university: program.university,
          programCode: program.code,
          format,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not queue your answer.');
        setPhase('response');
        return;
      }
      setQueuePosition(typeof data.queued === 'number' ? data.queued : null);
      setJobId(data.id);
    } catch {
      setError('Network error. Check your connection and try again.');
      setPhase('response');
    }
  }

  function reset() {
    setPhase('idle');
    setPrompt('');
    setAnswer('');
    setFeedback(null);
    setError(null);
    setJobId(null);
    setQueuePosition(null);
    setTimeLeft(0);
  }

  const mins = String(Math.floor(Math.max(timeLeft, 0) / 60)).padStart(2, '0');
  const secs = String(Math.max(timeLeft, 0) % 60).padStart(2, '0');
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Configuration */}
      <aside className="panel h-fit space-y-4 p-5">
        <h2 className="text-lg font-semibold text-cream">Configuration</h2>

        <div>
          <label htmlFor="sim-program" className="mb-1 block text-xs font-medium text-muted">
            Select Target University &amp; Program
          </label>
          <select
            id="sim-program"
            value={programCode}
            onChange={(e) => setProgramCode(e.target.value)}
            className="w-full rounded-lg border border-line bg-ink p-2.5 text-sm text-cream outline-none focus:border-accent"
          >
            {PROGRAM_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {SIMULATOR_PROGRAMS.filter((p) => p.group === group).map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sim-type" className="mb-1 block text-xs font-medium text-muted">
            Question Format
          </label>
          <select
            id="sim-type"
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            className="w-full rounded-lg border border-line bg-ink p-2.5 text-sm text-cream outline-none focus:border-accent"
          >
            {(Object.keys(FORMATS) as Format[]).map((f) => (
              <option key={f} value={f}>
                {FORMATS[f].label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={startSimulation}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-ink shadow-lg shadow-accent/20 transition hover:bg-accent-soft"
        >
          Start Timed Simulation
        </button>

        <p className="text-xs leading-relaxed text-muted">
          {user
            ? `Signed in as ${user.email} — written answers are scored by Nova and saved to your analytics.`
            : 'Written answers are scored by Nova. Sign in when you submit to save your progress.'}
        </p>
      </aside>

      {/* Active area */}
      <section className="panel flex min-h-[460px] flex-col p-6 lg:col-span-2">
        {phase === 'idle' && (
          <div className="my-auto space-y-3 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-accent-soft" />
            <h3 className="text-lg font-medium text-cream">Choose your program &amp; format</h3>
            <p className="mx-auto max-w-md text-sm text-muted">
              Get authentic prompts from Ontario universities and simulate real exam
              conditions — strict prep and response timers included.
            </p>
          </div>
        )}

        {(phase === 'prep' || phase === 'response') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  phase === 'prep'
                    ? 'border-gold/30 bg-gold/10 text-gold'
                    : 'border-rose/30 bg-rose/10 text-rose'
                }`}
              >
                {phase === 'prep'
                  ? 'Preparation Time'
                  : format === 'written'
                    ? 'Writing Window'
                    : 'Recording Live'}
              </span>
              <div className="font-mono text-2xl font-bold text-cream">
                {mins}:{secs}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-soft">
                Official Prompt / Question
              </span>
              <div className="rounded-xl border border-line bg-ink p-4 text-lg font-medium text-cream">
                {prompt}
              </div>
              <p className="text-xs text-muted">
                {program.label} · {program.university}
              </p>
            </div>

            <div className="space-y-2">
              {format === 'written' ? (
                <>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    rows={6}
                    placeholder="Type your response here under the real time limit…"
                    className="w-full resize-y rounded-xl border border-line bg-ink p-3 text-sm text-cream outline-none focus:border-accent"
                  />
                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>{words} words</span>
                  </div>
                </>
              ) : (
                <div className="space-y-2 rounded-xl border border-line bg-ink p-8 text-center">
                  <Video className="mx-auto h-8 w-8 animate-pulse text-accent-soft" />
                  <p className="text-sm text-muted">
                    Camera feed active. Speak clearly into your microphone when the
                    recording window begins.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 border-l-2 border-rose bg-rose/10 px-4 py-3 text-sm text-rose">
                <MessageSquareWarning className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={reset}
                className="rounded-lg bg-panel-2 px-4 py-2 text-sm text-muted transition hover:text-cream"
              >
                Abort
              </button>
              <button
                onClick={progressSimulation}
                className="rounded-lg bg-accent px-5 py-2 text-sm font-medium text-ink transition hover:bg-accent-soft"
              >
                {phase === 'prep'
                  ? 'Skip Prep / Start Response Now'
                  : format === 'written'
                    ? 'Finish & Submit'
                    : 'Finish & Submit'}
              </button>
            </div>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="my-auto space-y-4 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent-soft" />
            <h3 className="text-lg font-medium text-cream">
              {queuePosition === null
                ? 'Queued for scoring…'
                : `Queued — position #${queuePosition}`}
            </h3>
            <p className="mx-auto max-w-md text-sm text-muted">
              {capReached
                ? 'Today’s free scoring limit is reached. Your answer stays in the queue and will be scored when the limit resets — or try again tomorrow.'
                : 'Nova scores answers in order, a few at a time, so nobody gets rate-limited. This usually takes under a minute. Keep this tab open.'}
            </p>
          </div>
        )}

        {phase === 'feedback' && feedback && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
                Nova&apos;s Evaluation
              </span>
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-lg bg-panel-2 px-4 py-2 text-sm text-muted transition hover:text-cream"
              >
                <RotateCcw className="h-4 w-4" /> Try Another
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-b border-line pb-6">
              <ScoreRing score={feedback.score} />
              <div className="min-w-0 flex-1">
                <h3 className="eyebrow">Verdict</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-cream">
                  {feedback.verdict}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-cream">
                  <Check className="h-4 w-4 text-accent" /> What works
                </h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-cream/90">
                  {feedback.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-cream">
                  <ArrowRight className="h-4 w-4 text-gold" /> What to fix
                </h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-cream/90">
                  {feedback.fixes.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-cream">Model rewrite</h4>
              <p className="mt-3 whitespace-pre-wrap border-l-2 border-accent-soft bg-ink p-4 text-[15px] leading-relaxed text-cream">
                {feedback.rewrite}
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4">
              <Link
                href="/analytics"
                className="flex items-center gap-2 text-sm font-semibold text-accent-soft hover:underline"
              >
                See it in your analytics <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="flex items-center gap-1 text-xs text-accent">
                <Check className="h-3.5 w-3.5" /> Saved to your account
              </span>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="my-auto space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-xl text-accent">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-cream">Simulation Completed!</h3>
            <p className="mx-auto max-w-md text-sm text-muted">
              Great discipline. Review your delivery and practice another prompt.
              Written answers get scored by Nova.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={reset}
                className="flex items-center gap-2 rounded-lg bg-panel-2 px-4 py-2 text-sm text-muted transition hover:text-cream"
              >
                <RotateCcw className="h-4 w-4" /> Try Another
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
