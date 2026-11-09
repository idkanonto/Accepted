"use client";
import { useStageFocus } from "./use-stage-focus";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { computeStats, type Stats } from "@/lib/analytics";
import type { Attempt } from "@/lib/storage";
import { authFetch } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/track";
import { useAuth } from "./auth-provider";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  EmptyState,
  LoadingState,
  Notice,
  SectionHeading,
} from "./ui";
import Dialog from "./dialog";
import ScoreRing from "./score-ring";

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
      verdict: j.verdict ?? "",
      strengths: j.strengths ?? [],
      fixes: j.fixes ?? [],
      rewrite: j.rewrite ?? "",
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
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);
  const summaryRef = useStageFocus<HTMLElement>(
    summary,
    Boolean(summary) && !loadingSummary,
    true,
  );

  async function load() {
    setError(null);
    if (!user) {
      setAttempts([]);
      return;
    }
    try {
      const res = await authFetch("/api/analytics");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load your history.");
        return;
      }
      const jobs = (data.jobs ?? []).filter((j: JobRow) => j.status === "done");
      setAttempts(jobs.map(toAttempt));
    } catch {
      setError("Network error. Try again.");
    }
  }

  useEffect(() => {
    if (!authLoading) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  const stats: Stats | null = useMemo(
    () => (attempts ? computeStats(attempts) : null),
    [attempts],
  );

  async function askNova() {
    if (!stats) return;
    trackEvent("breakdown_requested", { attempts: String(stats.total) });
    setLoadingSummary(true);
    setError(null);
    setSummary(null);
    try {
      const res = await authFetch("/api/summary", {
        method: "POST",
        body: JSON.stringify({ stats }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not reach Nova.");
        return;
      }
      setSummary(data as Summary);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoadingSummary(false);
    }
  }

  async function clearHistory() {
    setClearing(true);
    try {
      const res = await authFetch("/api/analytics", { method: "DELETE" });
      if (res.ok) {
        setAttempts([]);
        setSummary(null);
        setConfirmClear(false);
      } else {
        const data = await res.json();
        setError(data.error ?? "Could not clear history.");
        setConfirmClear(false);
      }
    } catch {
      setError("Could not clear history.");
      setConfirmClear(false);
    } finally {
      setClearing(false);
    }
  }

  if (authLoading) return <LoadingState title="Checking your account…" />;
  if (!user)
    return (
      <div className="panel">
        <EmptyState
          icon={<ChartNoAxesCombined />}
          title="Your practice has a story."
          description="Sign in to keep your scores, progress, and Nova’s breakdowns together."
          action={
            <Button onClick={openAuth}>
              Sign in <ArrowRight size={14} />
            </Button>
          }
        />
      </div>
    );
  if (attempts === null)
    return error ? (
      <div className="panel panel-pad space-y-4">
        <Notice tone="error">{error}</Notice>
        <Button variant="secondary" onClick={load}>
          Try loading again
        </Button>
      </div>
    ) : (
      <div className="panel">
        <LoadingState
          title="Gathering your progress…"
          description="Bringing your scored responses into one clear view."
        />
      </div>
    );
  if (!stats || stats.total === 0)
    return (
      <div className="panel">
        <EmptyState
          icon={<ChartNoAxesCombined />}
          title="Your first attempt is a beginning."
          description="Write one supplemental response and let Nova give you a starting point. Your progress will grow from there."
          action={
            <Link href="/simulator" className="btn-primary">
              Start practising <ArrowRight size={15} />
            </Link>
          }
        />
        {error && (
          <div className="px-6 pb-6">
            <Notice tone="error">{error}</Notice>
          </div>
        )}
      </div>
    );
  return (
    <div className="space-y-6 reveal">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="body-copy">
          A clearer view of the work you’re putting in.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={askNova} disabled={loadingSummary}>
            <Sparkles size={15} />
            {loadingSummary
              ? "Reading your record…"
              : "Ask Nova for a breakdown"}
          </Button>
          <Button variant="quiet" onClick={() => setConfirmClear(true)}>
            <Trash2 size={14} />
            Clear history
          </Button>
        </div>
      </div>
      <div className="metric-band">
        {[
          { label: "Answers scored", value: String(stats.total) },
          { label: "Average score / 100", value: String(stats.avgScore) },
          { label: "Your best score", value: String(stats.bestScore) },
        ].map((metric) => (
          <div className="metric" key={metric.label}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
          </div>
        ))}
        <div className="metric">
          <p>A place to focus</p>
          <strong className="mt-2! text-sm! leading-6! tracking-normal!">
            {stats.weakest?.program ?? "—"}
          </strong>
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {loadingSummary && (
        <div className="panel">
          <LoadingState
            title="Nova is connecting the dots…"
            description="Looking for strengths, patterns and a useful next step."
          />
        </div>
      )}
      {summary && (
        <section
          ref={summaryRef}
          tabIndex={-1}
          aria-label="Nova practice breakdown"
          className="coaching-sheet stage-focus"
        >
          <SectionHeading
            title="A note from Nova"
            action={
              <Badge tone="accent">
                <Sparkles size={12} />
                Your practice, in perspective
              </Badge>
            }
          />
          <p className="body-copy mt-4 text-foreground!">{summary.summary}</p>
          <div className="mt-6 grid gap-7 md:grid-cols-3">
            {[
              { title: "Build on your strengths", items: summary.strengths },
              { title: "Give these some attention", items: summary.focusAreas },
              { title: "Your next useful steps", items: summary.actions },
            ].map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold">{group.title}</h3>
                <ul className="feedback-list mt-2">
                  {group.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="panel panel-pad">
          <SectionHeading
            title="Practice by program"
            description="Average score, on a 0–100 scale."
          />
          <div className="mt-6 space-y-5">
            {stats.perProgram.map((program) => (
              <div
                key={`${program.university}-${program.program}`}
                role="img"
                aria-label={`${program.program}: average ${program.avg} out of 100 from ${program.count} responses`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-medium leading-5">
                      {program.program}
                    </h3>
                    <p className="mt-1 text-[10px] text-muted">
                      {program.count} response{program.count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span className="font-mono text-xs font-medium text-accent">
                    {program.avg}
                  </span>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-inset">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${program.avg}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel panel-pad">
          <SectionHeading
            title="A little progress, over time"
            description="Your average score over the last eight weeks."
          />
          <div
            className="mt-7 flex h-44 items-end gap-2"
            role="img"
            aria-label={stats.trend
              .map(
                (week) =>
                  `${week.label}: ${week.avg === null ? "no attempts" : week.avg + " out of 100"}`,
              )
              .join("; ")}
          >
            {stats.trend.map((week, index) => (
              <div
                key={index}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <span
                  className={`font-mono text-[9px] ${week.avg === null ? "text-muted" : "text-accent"}`}
                >
                  {week.avg ?? "—"}
                </span>
                <div className="flex h-24 w-full items-end rounded-t bg-inset">
                  <div
                    className="w-full rounded-t bg-accent/70"
                    style={{ height: `${week.avg ?? 0}%` }}
                    title={`${week.label}: ${week.avg ?? "No attempts"}`}
                  />
                </div>
                <span className="text-center text-[9px] text-muted">
                  {week.label}
                </span>
              </div>
            ))}
          </div>
          <p className="fine-print mt-5">
            Every attempt is a reference point, not a verdict on your potential.
          </p>
        </section>
      </div>
      <section className="panel overflow-hidden">
        <div className="panel-pad">
          <SectionHeading
            title="Recent attempts"
            description="Revisit a response. Notice what’s getting stronger."
            action={<Badge>{stats.recent.length} recent</Badge>}
          />
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">
              Recent scored practice responses; choose a question to review your
              feedback
            </caption>
            <thead>
              <tr>
                <th className="hidden sm:table-cell">Date</th>
                <th>Practice response</th>
                <th className="hidden md:table-cell">Program</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="hidden whitespace-nowrap text-xs text-muted sm:table-cell">
                    {new Date(attempt.createdAt).toLocaleDateString("en-CA", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="max-w-md">
                    <button
                      onClick={() => setSelectedAttempt(attempt)}
                      className="min-h-11 text-left text-xs font-medium leading-6 hover:text-accent"
                      aria-label={`Review response: ${attempt.question}`}
                    >
                      {attempt.question}
                    </button>
                    <p className="mt-1 text-[10px] text-muted md:hidden">
                      {attempt.program}
                    </p>
                  </td>
                  <td className="hidden text-xs text-muted md:table-cell">
                    {attempt.program}
                  </td>
                  <td className="text-right font-mono text-sm text-accent">
                    {attempt.feedback.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <Dialog
        open={confirmClear}
        onClose={() => {
          if (!clearing) setConfirmClear(false);
        }}
        title="Clear your practice history?"
      >
        <p className="body-copy">
          This removes your scored attempts from your account. Your application
          planner and activity drafts stay on this device.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button
            variant="secondary"
            disabled={clearing}
            onClick={() => setConfirmClear(false)}
          >
            Keep history
          </Button>
          <Button variant="danger" disabled={clearing} onClick={clearHistory}>
            {clearing ? "Clearing…" : "Clear history"}
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={selectedAttempt !== null}
        onClose={() => setSelectedAttempt(null)}
        title="A closer look at your response"
        className="max-w-2xl!"
      >
        {selectedAttempt && (
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <ScoreRing score={selectedAttempt.feedback.score} />
              <div>
                <p className="eyebrow">{selectedAttempt.program}</p>
                <p className="body-copy mt-2 text-foreground!">
                  {selectedAttempt.feedback.verdict}
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold">The practice prompt</h3>
              <p className="body-copy mt-2">{selectedAttempt.question}</p>
            </div>
            <div>
              <h3 className="text-xs font-semibold">Your response</h3>
              <p className="body-copy mt-2 whitespace-pre-wrap">
                {selectedAttempt.answer}
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold">What worked</h3>
                <ul className="feedback-list">
                  {selectedAttempt.feedback.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold">For next time</h3>
                <ul className="feedback-list">
                  {selectedAttempt.feedback.fixes.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="coaching-sheet">
              <h3>Model rewrite</h3>
              <p className="body-copy mt-3 whitespace-pre-wrap">
                {selectedAttempt.feedback.rewrite}
              </p>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
