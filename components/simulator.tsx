"use client";
import { useStageFocus } from "./use-stage-focus";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  SIMULATOR_PROGRAMS,
  PROGRAM_GROUPS,
  getSimulatorProgram,
} from "@/lib/data/prompts";
import { authFetch } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/track";
import { useAuth } from "./auth-provider";
import ScoreRing from "./score-ring";
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  Notice,
  SectionHeading,
} from "./ui";
import {
  ArrowRight,
  Check,
  GraduationCap,
  RotateCcw,
  Video,
} from "lucide-react";

type Format = "video" | "written";
type Phase = "idle" | "prep" | "response" | "waiting" | "feedback" | "done";
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

const DRAFT_KEY = "accepted-simulator-draft";
const MAX_WORDS = 500;
const MAX_CHARS = 4000;

const FORMATS: Record<
  Format,
  { label: string; prep: number; response: number }
> = {
  written: {
    label: "Written essay / AIF (60s prep / 10 min write)",
    prep: 60,
    response: 600,
  },
  video: {
    label: "Video response (30s prep / 2 min speak)",
    prep: 30,
    response: 120,
  },
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
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const f = value as Record<string, unknown>;
  return (
    typeof f.score === "number" &&
    typeof f.verdict === "string" &&
    Array.isArray(f.strengths) &&
    Array.isArray(f.fixes) &&
    typeof f.rewrite === "string"
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

  const [programCode, setProgramCode] = useState<string>("queens_comm");
  const [format, setFormat] = useState<Format>("written");
  const [promptChoice, setPromptChoice] = useState("random");
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [quota, setQuota] = useState<Quota | null>(null);

  const [jobId, setJobId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [capReached, setCapReached] = useState(false);
  const [draftOwner, setDraftOwner] = useState<string | null>(null);
  const handledExpiry = useRef(false);
  const stageRef = useStageFocus<HTMLElement>(
    phase,
    ["prep", "waiting", "feedback", "done"].includes(phase),
  );

  const program = getSimulatorProgram(programCode) ?? SIMULATOR_PROGRAMS[0];

  useEffect(() => {
    const p = params.get("program");
    if (p && getSimulatorProgram(p)) setProgramCode(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    if (authLoading) return;
    const owner = user?.id ?? "guest";
    const key = `${DRAFT_KEY}:${owner}`;
    try {
      const stored =
        localStorage.getItem(key) ??
        (user ? localStorage.getItem(`${DRAFT_KEY}:guest`) : null);
      if (stored) {
        const draft = JSON.parse(stored) as Partial<StoredDraft>;
        if (
          typeof draft.programCode === "string" &&
          getSimulatorProgram(draft.programCode) &&
          (draft.format === "written" || draft.format === "video") &&
          typeof draft.prompt === "string" &&
          typeof draft.answer === "string" &&
          typeof draft.timeLeft === "number" &&
          ["idle", "prep", "response", "waiting", "feedback", "done"].includes(
            draft.phase ?? "",
          )
        ) {
          setProgramCode(draft.programCode);
          setFormat(draft.format);
          const restoredPhase = draft.phase as Phase;
          const restoredTime = Math.max(0, Math.floor(draft.timeLeft));
          const needsTimer =
            restoredPhase === "prep" || restoredPhase === "response";
          // A draft saved after its timer expired must not submit on its own.
          if (needsTimer && restoredTime === 0) {
            setPhase("response");
            setTimeLeft(FORMATS[draft.format].response);
          } else {
            setPhase(
              restoredPhase === "waiting" && !draft.jobId
                ? "response"
                : restoredPhase,
            );
            setTimeLeft(restoredTime);
          }
          setPrompt(draft.prompt);
          setAnswer(draft.answer);
          const restoredFeedback = isFeedback(draft.feedback)
            ? draft.feedback
            : null;
          setFeedback(restoredFeedback);
          if (restoredPhase === "feedback" && !restoredFeedback)
            setPhase("response");
          setJobId(typeof draft.jobId === "string" ? draft.jobId : null);
        }
      }
    } catch {
      setError("Could not restore your saved practice draft.");
    }
    setDraftOwner(owner);
  }, [authLoading, user]);

  useEffect(() => {
    if (!draftOwner || authLoading || draftOwner !== (user?.id ?? "guest"))
      return;
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
      setError(
        "Browser storage is unavailable; this practice draft may not persist.",
      );
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
    if (phase !== "prep" && phase !== "response") return;
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Time-up handling
  useEffect(() => {
    if (timeLeft > 0) return;
    if (phase === "prep") {
      handledExpiry.current = false;
      setPhase("response");
      setTimeLeft(FORMATS[format].response);
    } else if (phase === "response" && !handledExpiry.current) {
      handledExpiry.current = true;
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
            setError(
              "Your sign-in expired. Sign in again to continue checking this evaluation.",
            );
          } else if (res.status === 404) {
            setError(
              "This evaluation could not be found. Start a new practice attempt.",
            );
          }
          setJobId(null);
          setPhase("response");
          return;
        }
        const data = await res.json();
        if (stopped) return;
        setError(null);
        setQueuePosition(
          typeof data.position === "number" ? data.position : null,
        );
        setCapReached(Boolean(data.capReached));

        if (data.status === "done") {
          setFeedback(toFeedback(data));
          setPhase("feedback");
          setJobId(null);
          return;
        } else if (data.status === "failed") {
          setError(data.error ?? "Evaluation failed. Please try again.");
          setPhase("response");
          setJobId(null);
          return;
        }
      } catch {
        if (!stopped)
          setError(
            "Connection interrupted. Checking your saved evaluation again shortly.",
          );
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
    handledExpiry.current = false;
    const prompts = program.prompts;
    setPrompt(
      promptChoice !== "random" && prompts.includes(promptChoice)
        ? promptChoice
        : prompts[Math.floor(Math.random() * prompts.length)],
    );
    setAnswer("");
    setFeedback(null);
    setError(null);
    setQuota(null);
    setJobId(null);
    setQueuePosition(null);
    setCapReached(false);
    setPhase("prep");
    setTimeLeft(FORMATS[format].prep);
    trackEvent("simulation_started", { program: program.code, format });
  }

  function progressSimulation() {
    if (phase === "prep") {
      setPhase("response");
      setTimeLeft(FORMATS[format].response);
    } else if (phase === "response") {
      if (format === "video") setPhase("done");
      else submit();
    }
  }

  function handleTimeUp() {
    if (format === "written" && answer.trim().length >= 20) {
      submit();
    } else if (format === "written") {
      setError("Time is up. Write at least a sentence or two, then submit.");
    } else {
      setPhase("done");
    }
  }

  async function submit() {
    if (answer.trim().length < 20) {
      setError("Write at least a sentence or two before asking for a score.");
      return;
    }
    if (words > MAX_WORDS || answer.length > MAX_CHARS) {
      setError(
        `Keep the answer to ${MAX_WORDS} words and ${MAX_CHARS.toLocaleString()} characters or fewer.`,
      );
      return;
    }
    if (authLoading) return;
    if (!user) {
      openAuth();
      return;
    }
    setError(null);
    setPhase("waiting");
    try {
      const res = await authFetch("/api/jobs", {
        method: "POST",
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
        setError(data.error ?? "Could not score your answer.");
        if (res.status === 429) {
          trackEvent("quota_blocked", {
            program: program.code,
            limit: data.quota?.limit != null ? String(data.quota.limit) : null,
          });
        } else {
          trackEvent("evaluation_failed", { program: program.code });
        }
        setPhase("response");
        return;
      }
      // The answer is scored in the same request; render it immediately.
      if (data.status === "done") {
        setFeedback(toFeedback(data));
        setQuota(data.quota ?? null);
        setPhase("feedback");
        trackEvent("evaluation_completed", {
          program: program.code,
          format,
          score: String(data.score),
          words: String(words),
          quota_used: data.quota?.used != null ? String(data.quota.used) : null,
        });
        return;
      }
      setQueuePosition(
        typeof data.position === "number" ? data.position : null,
      );
      setJobId(data.id);
    } catch {
      setError("Network error. Check your connection and try again.");
      setPhase("response");
    }
  }

  function reset() {
    handledExpiry.current = false;
    setPhase("idle");
    setPrompt("");
    setAnswer("");
    setFeedback(null);
    setError(null);
    setQuota(null);
    setJobId(null);
    setQueuePosition(null);
    setTimeLeft(0);
  }

  const mins = String(Math.floor(Math.max(timeLeft, 0) / 60)).padStart(2, "0");
  const secs = String(Math.max(timeLeft, 0) % 60).padStart(2, "0");
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const overLimit = words > MAX_WORDS || answer.length > MAX_CHARS;

  const active =
    phase === "prep" || phase === "response" || phase === "waiting";
  return (
    <div
      className={`practice-grid reveal ${phase !== "idle" ? "session-in-progress" : ""}`}
    >
      <aside className="panel panel-pad space-y-5">
        <div>
          <p className="eyebrow">Your session</p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            Make space to practise.
          </h2>
        </div>
        <div>
          <label htmlFor="sim-program" className="field-label">
            University &amp; program
          </label>
          <select
            id="sim-program"
            className="field"
            disabled={active}
            value={programCode}
            onChange={(event) => {
              setProgramCode(event.target.value);
              setPromptChoice("random");
            }}
          >
            {PROGRAM_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {SIMULATOR_PROGRAMS.filter((item) => item.group === group).map(
                  (item) => (
                    <option key={item.code} value={item.code}>
                      {item.label}
                    </option>
                  ),
                )}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sim-type" className="field-label">
            Practice format
          </label>
          <select
            id="sim-type"
            className="field"
            value={format}
            disabled={active}
            onChange={(event) => setFormat(event.target.value as Format)}
          >
            {(Object.keys(FORMATS) as Format[]).map((value) => (
              <option key={value} value={value}>
                {FORMATS[value].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sim-prompt" className="field-label">
            Choose a prompt
          </label>
          <select
            id="sim-prompt"
            className="field"
            value={promptChoice}
            disabled={active}
            onChange={(event) => setPromptChoice(event.target.value)}
          >
            <option value="random">Surprise me</option>
            {program.prompts.map((item, index) => (
              <option key={item} value={item}>
                {index + 1}. {item}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={startSimulation} disabled={active} className="w-full">
          Start timed simulation <ArrowRight size={14} />
        </Button>
        <div className="border-t border-line pt-4">
          <p className="text-[11px] font-medium">
            {format === "written"
              ? "A focused written response"
              : "Practise speaking with confidence"}
          </p>
          <p className="fine-print mt-2">
            {format === "written"
              ? "60 seconds to prepare. 10 minutes to write. Keep your answer within 500 words."
              : "30 seconds to prepare. 2 minutes to speak. This timer does not record audio."}
          </p>
        </div>
        <p className="fine-print break-words">
          {user
            ? `Signed in as ${user.email}. Scored answers are saved to your account.`
            : "Your draft stays on this device. Sign in to submit for feedback."}
        </p>
      </aside>
      <section
        ref={stageRef}
        tabIndex={-1}
        className="panel panel-pad practice-stage stage-focus"
        aria-label="Practice session"
      >
        {phase === "idle" && (
          <div>
            <div className="step-track border-b border-line pb-5">
              <span className="current">
                <b>1</b>Prepare
              </span>
              <span>
                <b>2</b>Respond
              </span>
              <span>
                <b>3</b>Reflect
              </span>
            </div>
            <EmptyState
              icon={<GraduationCap />}
              title="A little practice changes the blank page."
              description="Choose a program and format. A representative question, a clear timer, and room to find your answer are waiting."
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Badge>{FORMATS[format].prep}s preparation</Badge>
              <Badge>{FORMATS[format].response / 60} min response</Badge>
              <Badge tone="accent">
                {format === "written" ? "Nova feedback" : "Speaking practice"}
              </Badge>
            </div>
            <p className="fine-print mt-6 text-center">
              Practice prompts are not official admissions questions.
            </p>
          </div>
        )}
        {(phase === "prep" || phase === "response") && (
          <div>
            <div className="timer-strip">
              <div>
                <div className="step-track">
                  <span className={phase === "prep" ? "current" : ""}>
                    <b>{phase === "response" ? <Check size={10} /> : 1}</b>
                    Prepare
                  </span>
                  <span className={phase === "response" ? "current" : ""}>
                    <b>2</b>Respond
                  </span>
                  <span>
                    <b>3</b>Reflect
                  </span>
                </div>
                <p className="fine-print mt-3">
                  {phase === "prep"
                    ? "Read the question. Gather your thoughts."
                    : format === "written"
                      ? "Your writing window is open."
                      : "Speak naturally. Make one clear point at a time."}
                </p>
              </div>
              <div
                className={`practice-timer ${timeLeft <= 30 && phase === "response" ? "text-danger" : "text-accent"}`}
                role="timer"
                aria-label={`${phase === "prep" ? "Preparation" : "Response"} time remaining`}
              >
                {mins}:{secs}
              </div>
            </div>
            <div className="prompt-sheet">
              <p className="eyebrow">Your practice prompt</p>
              <blockquote>{prompt}</blockquote>
              <p className="fine-print">
                {program.label} · {program.university}
              </p>
            </div>
            {format === "written" ? (
              <div>
                <label htmlFor="sim-answer" className="field-label">
                  Your response
                </label>
                <textarea
                  id="sim-answer"
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows={8}
                  placeholder="Begin with a specific moment. What happened, what did you do, and what did you learn?"
                  className="field response-editor"
                  aria-describedby="sim-word-limit"
                />
                <div
                  className="mt-3 flex flex-wrap justify-between gap-2 text-[11px]"
                  id="sim-word-limit"
                >
                  <span className={overLimit ? "text-danger" : "text-muted"}>
                    {words} / {MAX_WORDS} words ·{" "}
                    {answer.length.toLocaleString()} /{" "}
                    {MAX_CHARS.toLocaleString()} characters
                  </span>
                  <span className={overLimit ? "text-danger" : "text-muted"}>
                    {overLimit
                      ? "Over the limit — trim before submitting."
                      : "Your draft saves automatically."}
                  </span>
                </div>
              </div>
            ) : (
              <div className="panel-inset px-6 py-8 text-center">
                <Video size={28} className="mx-auto text-accent" />
                <p className="mt-3 text-sm font-medium">
                  This moment is yours.
                </p>
                <p className="body-copy mx-auto mt-2 max-w-md text-xs!">
                  Practise aloud. This timer does not record audio. For
                  transcription and scored feedback, use the mock interview.
                </p>
              </div>
            )}
            {error && (
              <Notice tone="error" className="mt-5">
                {error}
              </Notice>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <Button variant="quiet" onClick={reset}>
                End session
              </Button>
              <Button onClick={progressSimulation}>
                {phase === "prep"
                  ? "Skip prep / start now"
                  : format === "written"
                    ? "Finish & submit"
                    : "Finish"}
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}
        {phase === "waiting" && (
          <div>
            <LoadingState
              title={
                queuePosition === null
                  ? "Nova is reading your response…"
                  : `In the queue · position ${queuePosition}`
              }
              description={
                capReached
                  ? "Today’s free scoring limit is reached. Your answer stays queued until the limit resets."
                  : "Looking at your ideas, your evidence, and the next useful improvement."
              }
            />
            <p className="fine-print text-center">
              Your result will appear here when it is ready.
            </p>
            {error && <Notice className="mt-5">{error}</Notice>}
          </div>
        )}
        {phase === "feedback" && feedback && (
          <div className="space-y-6">
            <SectionHeading
              title="A little perspective from Nova."
              action={
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw size={14} />
                  Try another
                </Button>
              }
            />
            <div className="flex flex-col gap-5 border-b border-line pb-6 sm:flex-row sm:items-center">
              <ScoreRing score={feedback.score} size={106} />
              <div className="min-w-0">
                <p className="eyebrow">Your evaluation</p>
                <p className="mt-2 text-base font-medium leading-7">
                  {feedback.verdict}
                </p>
                <p className="fine-print mt-2">
                  A practice score, not an admissions decision.
                </p>
              </div>
            </div>
            <div className="grid gap-7 sm:grid-cols-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Check size={16} className="text-success" />
                  Keep doing this
                </h3>
                <ul className="feedback-list mt-2">
                  {feedback.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <ArrowRight size={16} className="text-accent" />
                  For your next answer
                </h3>
                <ul className="feedback-list mt-2">
                  {feedback.fixes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="coaching-sheet">
              <p className="eyebrow mb-2">See the difference</p>
              <h3>A model rewrite</h3>
              <p className="body-copy mt-4 whitespace-pre-wrap text-foreground!">
                {feedback.rewrite}
              </p>
            </div>
            <details className="border-b border-line pb-5 text-xs">
              <summary className="min-h-8 cursor-pointer font-medium text-secondary">
                Revisit your original response
              </summary>
              <p className="fine-print mt-3">{prompt}</p>
              <p className="body-copy mt-3 whitespace-pre-wrap">{answer}</p>
            </details>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/analytics" className="text-link">
                See your progress <ArrowRight size={14} />
              </Link>
              <Badge tone="success">
                <Check size={12} />
                Saved to your account
              </Badge>
            </div>
            {quota && (
              <p className="fine-print">
                {quota.used} of {quota.limit} free evaluations used today.
              </p>
            )}
          </div>
        )}
        {phase === "done" && (
          <EmptyState
            icon={<Check />}
            title="One more practice, in the books."
            description="Take a moment to reflect on what felt clear and what you’d change. For spoken answers with transcription and feedback, try a mock interview."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw size={14} />
                  Try another
                </Button>
                <Link href="/interview" className="btn-primary">
                  Try an interview <ArrowRight size={14} />
                </Link>
              </div>
            }
          />
        )}
      </section>
    </div>
  );
}
