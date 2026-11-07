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
type StoredDraft = {
  programCode: string;
  format: Format;
  phase: Phase;
  timeLeft: number;
  prompt: string;
  answer: string;
  feedback: Feedback | null;
  jobId: string | null;
};

const DRAFT_KEY = 'accepted-simulator-draft';
const MAX_WORDS = 500;
const MAX_CHARS = 4000;

const FORMATS: Record<Format, { label: string; prep: number; response: number }> = {
  written: { label: 'Written essay / AIF (60s prep / 10 min write)', prep: 60, response: 600 },
  video: { label: 'Video response (30s prep / 2 min speak)', prep: 30, response: 120 },
};

type Feedback = {
  score: number;
  verdict: string;
  strengths: string[];
  fixes: string[];
  rewrite: string;
};

type Quota = { used: number; limit: number; resetAt: string };


function isFeedback(value: unknown): value is Feedback {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const f = value as Record<string, unknown>;
  return (
    typeof f.score === 'number' &&
    typeof f.verdict === 'string' &&
    Array.isArray(f.strengths) &&
    Array.isArray(f.fixes) &&
    typeof f.rewrite === 'string'
  );
}

function toFeedback(data: {
  score: number;
  verdict: string;
  strengths: string[] | null;
  fixes: string[] | null;
  rewrite: string;
}): Feedback {
  return {
    score: data.score,
    verdict: data.verdict,
    strengths: data.strengths ?? [],
    fixes: data.fixes ?? [],
    rewrite: data.rewrite,
  };
}

export default function Simulator() {
  const params = useSearchParams();
  const { user, loading: authLoading, openAuth } = useAuth();

  const [programCode, setProgramCode] = useState<string>('queens_comm');
  const [format, setFormat] = useState<Format>('written');
  const [phase, setPhase] = useState<Phase>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [capReached, setCapReached] = useState(false);
  const [draftOwner, setDraftOwner] = useState<string | null>(null);

  const program = getSimulatorProgram(programCode) ?? SIMULATOR_PROGRAMS[0];

  useEffect(() => {
    const p = params.get('program');
    if (p && getSimulatorProgram(p)) setProgramCode(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (authLoading) return;
    const owner = user?.id ?? 'guest';
    const key = `${DRAFT_KEY}:${owner}`;
    try {
      const stored =
        localStorage.getItem(key) ?? (user ? localStorage.getItem(`${DRAFT_KEY}:guest`) : null);
      if (stored) {
        const draft = JSON.parse(stored) as Partial<StoredDraft>;
        if (
          typeof draft.programCode === 'string' &&
          getSimulatorProgram(draft.programCode) &&
          (draft.format === 'written' || draft.format === 'video') &&
          typeof draft.prompt === 'string' &&
          typeof draft.answer === 'string' &&
          typeof draft.timeLeft === 'number' &&
          ['idle', 'prep', 'response', 'waiting', 'feedback', 'done'].includes(draft.phase ?? '')
        ) {
          setProgramCode(draft.programCode);
          setFormat(draft.format);
          const restoredPhase = draft.phase as Phase;
          const restoredTime = Math.max(0, Math.floor(draft.timeLeft));
          const needsTimer = restoredPhase === 'prep' || restoredPhase === 'response';
          // A draft saved after its timer expired must not submit on its own.
          if (needsTimer && restoredTime === 0) {
            setPhase('response');
            setTimeLeft(FORMATS[draft.format].response);
          } else {
            setPhase(restoredPhase === 'waiting' && !draft.jobId ? 'response' : restoredPhase);
            setTimeLeft(restoredTime);
          }
          setPrompt(draft.prompt);
          setAnswer(draft.answer);
          const restoredFeedback = isFeedback(draft.feedback) ? draft.feedback : null;
          setFeedback(restoredFeedback);
          if (restoredPhase === 'feedback' && !restoredFeedback) setPhase('response');
          setJobId(typeof draft.jobId === 'string' ? draft.jobId : null);
        }
      }
    } catch {
      setError('Could not restore your saved practice draft.');
    }
    setDraftOwner(owner);
  }, [authLoading, user]);

  useEffect(() => {
    if (!draftOwner || authLoading || draftOwner !== (user?.id ?? 'guest')) return;
    try {
      const draft: StoredDraft = {
        programCode,
        format,
        phase,
        timeLeft,
        prompt,
        answer,
        feedback,
        jobId,
      };
      localStorage.setItem(`${DRAFT_KEY}:${draftOwner}`, JSON.stringify(draft));
    } catch {
      setError('Browser storage is unavailable; this practice draft may not persist.');
    }
  }, [
    draftOwner,
    authLoading,
    user,
    programCode,
    format,
    phase,
    timeLeft,
    prompt,
    answer,
    feedback,
    jobId,
  ]);

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

  // Poll the queue only when a job was left in the background (recovery path).
  useEffect(() => {
    if (!jobId) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      try {
        const res = await authFetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          if (res.status === 401) {
            setError('Your sign-in expired. Sign in again to continue checking this evaluation.');
          } else if (res.status === 404) {
            setError('This evaluation could not be found. Start a new practice attempt.');
          }
          setJobId(null);
          setPhase('response');
          return;
        }
        const data = await res.json();
        if (stopped) return;
        setError(null);
        setQueuePosition(typeof data.position === 'number' ? data.position : null);
        setCapReached(Boolean(data.capReached));

        if (data.status === 'done') {
          setFeedback(toFeedback(data));
          setPhase('feedback');
          setJobId(null);
          return;
        } else if (data.status === 'failed') {
          setError(data.error ?? 'Evaluation failed. Please try again.');
          setPhase('response');
          setJobId(null);
          return;
        }
      } catch {
        if (!stopped) setError('Connection interrupted. Checking your saved evaluation again shortly.');
      } finally {
        if (!stopped) timer = setTimeout(tick, 2_500);
      }
    };

    void tick();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [jobId]);

  function startSimulation() {
    const prompts = program.prompts;
    setPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
    setAnswer('');
    setFeedback(null);
    setError(null);
    setQuota(null);
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
      if (format === 'video') setPhase('done');
      else submit();
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
    if (words > MAX_WORDS || answer.length > MAX_CHARS) {
      setError(`Keep the answer under ${MAX_WORDS} words so it stays focused and fits the real format.`);
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
        setError(data.error ?? 'Could not score your answer.');
        setPhase('response');
        return;
      }
      // The answer is scored in the same request; render it immediately.
      if (data.status === 'done') {
        setFeedback(toFeedback(data));
        setQuota(data.quota ?? null);
        setPhase('feedback');
        return;
      }
      setQueuePosition(typeof data.position === 'number' ? data.position : null);
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
    setQuota(null);
    setJobId(null);
    setQueuePosition(null);
    setTimeLeft(0);
  }

  const mins = String(Math.floor(Math.max(timeLeft, 0) / 60)).padStart(2, '0');
  const secs = String(Math.max(timeLeft, 0) % 60).padStart(2, '0');
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const overLimit = words > MAX_WORDS || answer.length > MAX_CHARS;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      {/* Configuration */}
      <aside className="panel h-fit space-y-5 p-5">
        <div>
          <p className="eyebrow">Practice setup</p>
          <h2 className="mt-2 text-xl font-medium text-cream">Configuration</h2>
        </div>

        <div>
          <label htmlFor="sim-program" className="label">
            Target university &amp; program
          </label>
          <select
            id="sim-program"
            value={programCode}
            onChange={(e) => setProgramCode(e.target.value)}
            className="input"
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
          <label htmlFor="sim-type" className="label">
            Question format
          </label>
          <select
            id="sim-type"
            value={format}
            onChange={(e) => setFormat(e.target.value as Format)}
            className="input"
          >
            {(Object.keys(FORMATS) as Format[]).map((f) => (
              <option key={f} value={f}>
                {FORMATS[f].label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={startSimulation} className="btn-primary w-full">
          Start timed simulation
        </button>

        <p className="text-xs leading-5 text-muted">
          {user
            ? `Signed in as ${user.email}. Scored answers are saved to your account.`
            : 'Your draft is saved on this device. Sign in to submit for scoring.'}
        </p>
      </aside>

      {/* Active area */}
      <section className="panel flex min-h-[480px] flex-col p-6">
        {phase === 'idle' && (
          <div className="my-auto space-y-3 text-center">
            <GraduationCap className="mx-auto h-10 w-10 text-accent" />
            <h3 className="text-xl font-medium text-cream">Choose a program and format</h3>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted">
              Work through representative questions with strict prep and response timers.
              Confirm current application details with your chosen program.
            </p>
          </div>
        )}

        {(phase === 'prep' || phase === 'response') && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  phase === 'prep'
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-rose/40 bg-rose/10 text-rose'
                }`}
              >
                {phase === 'prep'
                  ? 'Preparation time'
                  : format === 'written'
                    ? 'Writing window'
                    : 'Response time'}
              </span>
              <div className="font-mono text-2xl font-semibold tabular-nums text-cream">
                {mins}:{secs}
              </div>
            </div>

            <div className="space-y-2">
              <p className="eyebrow">Practice prompt</p>
              <div className="rounded-lg border border-line bg-ink p-4 text-base leading-7 text-cream">
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
                    rows={7}
                    placeholder="Type your response here under the real time limit…"
                    className="input min-h-[180px] resize-y leading-6"
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className={overLimit ? 'font-medium text-rose' : 'text-muted'}>
                      {words} / {MAX_WORDS} words
                    </span>
                    {overLimit && (
                      <span className="text-rose">Over the limit — trim before submitting.</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-3 rounded-lg border border-line bg-ink p-8 text-center">
                  <Video className="mx-auto h-8 w-8 animate-pulse text-accent" />
                  <p className="mx-auto max-w-md text-sm leading-6 text-muted">
                    Use this window to practise aloud. This timer does not record audio. For
                    transcription and scored feedback, use the mock interview.
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
              <button onClick={reset} className="btn-ghost">
                Abort
              </button>
              <button onClick={progressSimulation} className="btn-primary">
                {phase === 'prep'
                  ? 'Skip prep / start now'
                  : format === 'written'
                    ? 'Finish & submit'
                    : 'Finish'}
              </button>
            </div>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="my-auto space-y-4 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-accent" />
            <h3 className="text-xl font-medium text-cream">
              {queuePosition === null ? 'Scoring your answer…' : `Queued — position #${queuePosition}`}
            </h3>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted">
              {capReached
                ? 'Today’s free scoring limit is reached. Your answer stays in the queue and will be scored when the limit resets.'
                : 'This usually takes a few seconds. Your result will appear here when it is ready.'}
            </p>
            {error && <p role="status" className="mx-auto max-w-md text-xs text-gold">{error}</p>}
          </div>
        )}

        {phase === 'feedback' && feedback && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                Nova&apos;s evaluation
              </span>
              <button onClick={reset} className="btn-ghost">
                <RotateCcw className="h-4 w-4" /> Try another
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 border-b border-line pb-6">
              <ScoreRing score={feedback.score} />
              <div className="min-w-0 flex-1">
                <h3 className="eyebrow">Verdict</h3>
                <p className="mt-2 text-base leading-7 text-cream">{feedback.verdict}</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-cream">
                  <Check className="h-4 w-4 text-accent" /> What works
                </h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-cream/90">
                  {feedback.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="flex items-center gap-2 text-sm font-semibold text-cream">
                  <ArrowRight className="h-4 w-4 text-gold" /> What to fix
                </h4>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-cream/90">
                  {feedback.fixes.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-cream">Model rewrite</h4>
              <p className="mt-3 whitespace-pre-wrap border-l-2 border-accent bg-ink p-4 text-base leading-7 text-cream">
                {feedback.rewrite}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <Link
                href="/analytics"
                className="flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
              >
                See it in your analytics <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-3 text-xs text-muted">
                {quota && (
                  <span>
                    {quota.used} of {quota.limit} free evaluations used today
                  </span>
                )}
                <span className="flex items-center gap-1 text-accent">
                  <Check className="h-3.5 w-3.5" /> Saved to your account
                </span>
              </div>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="my-auto space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-xl text-accent">
              <Check className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-medium text-cream">Simulation completed</h3>
            <p className="mx-auto max-w-md text-sm leading-6 text-muted">
              Written answers are scored by Nova. For spoken answers with transcription and
              feedback, use the mock interview.
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <button onClick={reset} className="btn-ghost">
                <RotateCcw className="h-4 w-4" /> Try another
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
