"use client";
import { useStageFocus } from "./use-stage-focus";

import { useEffect, useState } from "react";
import { ArrowRight, Layers3, Plus, Sprout, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge, Button, LoadingState, Notice, SectionHeading } from "./ui";
import { UNIVERSITIES } from "@/lib/data/programs";
import { EC_KEY, type EcLevel } from "@/lib/position";
import { authFetch } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/track";

type Ec = {
  id: string;
  name: string;
  role: string;
  duration: string;
  hours: string;
  detail: string;
};
type Result = {
  summary: string;
  overallLevel: EcLevel;
  ranked: { name: string; tier: EcLevel; why: string; leverage: string }[];
  gaps: string[];
};

const DRAFT_KEY = "accepted-ecs-draft-v1";
const MAX_ECS = 8;
const blank = (): Ec => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
  duration: "",
  hours: "",
  detail: "",
});

const TIER: Record<EcLevel, string> = {
  standout: "badge-accent",
  strong: "badge-success",
  solid: "badge-neutral",
  light: "badge-warning",
};

export default function EcRater() {
  const [ecs, setEcs] = useState<Ec[]>(() => [blank()]);
  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [ready, setReady] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const resultRef = useStageFocus<HTMLElement>(
    result,
    Boolean(result) && !loading && !error,
    true,
  );

  useEffect(() => {
    try {
      const d = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
      if (Array.isArray(d?.ecs) && d.ecs.length)
        setEcs(d.ecs.slice(0, MAX_ECS));
      if (typeof d?.target === "string") setTarget(d.target);
    } catch {
      // a bad draft just starts fresh
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ecs, target }));
      setStorageWarning(null);
    } catch {
      setStorageWarning(
        "Browser storage is unavailable. Keep a copy of your activities before leaving.",
      );
    }
  }, [ecs, target, ready]);

  const update = (id: string, patch: Partial<Ec>) =>
    setEcs((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  async function rate() {
    if (ecs.some((e) => !e.name.trim())) {
      setError("Give every activity a name, or remove the empty ones.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await authFetch("/api/ec", {
        method: "POST",
        body: JSON.stringify({
          target,
          ecs: ecs.map((e) => ({ ...e, hours: Number(e.hours) || 0 })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not rate your ECs.");
        return;
      }
      setResult(data);
      trackEvent("ec_rated", {
        count: String(ecs.length),
        level: data.overallLevel,
      });
      try {
        localStorage.setItem(
          EC_KEY,
          JSON.stringify({ level: data.overallLevel }),
        );
      } catch {
        // the planner just won't see the level
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_1fr] reveal">
      <section className="panel panel-pad">
        <SectionHeading
          title="The experiences that shaped you."
          description="Depth, responsibility, and impact matter more than a long list."
          action={
            <Badge>
              {ecs.length} / {MAX_ECS}
            </Badge>
          }
        />
        <div className="mt-6">
          <label htmlFor="ec-target" className="field-label">
            Target program{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id="ec-target"
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="field"
          >
            <option value="">Keep it broad / no specific program</option>
            {UNIVERSITIES.map((university) => (
              <optgroup key={university.key} label={university.name}>
                {university.programs.map((program) => (
                  <option
                    key={program.name}
                    value={`${university.name}: ${program.name}`}
                  >
                    {program.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {ecs.map((ec, index) => (
          <fieldset key={ec.id} className="activity-sheet">
            <legend className="sr-only">Activity {index + 1}</legend>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="folio-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-sm font-semibold">
                  {ec.name || "An experience worth sharing"}
                </h3>
              </div>
              {ecs.length > 1 && (
                <button
                  aria-label={`Remove activity ${index + 1}`}
                  className="icon-button"
                  onClick={() =>
                    setEcs((list) => list.filter((item) => item.id !== ec.id))
                  }
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor={`ec-name-${index}`} className="field-label">
                  Activity name
                </label>
                <input
                  id={`ec-name-${index}`}
                  value={ec.name}
                  maxLength={80}
                  placeholder="e.g. School robotics team"
                  onChange={(event) =>
                    update(ec.id, { name: event.target.value })
                  }
                  className="field"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor={`ec-role-${index}`} className="field-label">
                    Your role
                  </label>
                  <input
                    id={`ec-role-${index}`}
                    value={ec.role}
                    maxLength={80}
                    placeholder="Team captain"
                    onChange={(event) =>
                      update(ec.id, { role: event.target.value })
                    }
                    className="field"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`ec-duration-${index}`}
                    className="field-label"
                  >
                    How long
                  </label>
                  <input
                    id={`ec-duration-${index}`}
                    value={ec.duration}
                    maxLength={40}
                    placeholder="2 years"
                    onChange={(event) =>
                      update(ec.id, { duration: event.target.value })
                    }
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor={`ec-hours-${index}`} className="field-label">
                    Hours per week
                  </label>
                  <input
                    id={`ec-hours-${index}`}
                    value={ec.hours}
                    inputMode="numeric"
                    placeholder="4"
                    onChange={(event) =>
                      update(ec.id, {
                        hours: event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 2),
                      })
                    }
                    className="field"
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`ec-detail-${index}`} className="field-label">
                  What you did and what changed
                </label>
                <textarea
                  id={`ec-detail-${index}`}
                  value={ec.detail}
                  maxLength={600}
                  rows={3}
                  placeholder="Be specific about your contribution. What changed because you were there?"
                  onChange={(event) =>
                    update(ec.id, { detail: event.target.value })
                  }
                  className="field"
                />
                <p className="fine-print mt-2 text-right">
                  {ec.detail.length} / 600 characters
                </p>
              </div>
            </div>
          </fieldset>
        ))}
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={ecs.length >= MAX_ECS}
            onClick={() => setEcs((list) => [...list, blank()])}
          >
            <Plus size={14} />
            Add activity
          </Button>
          <span className="fine-print">Up to eight experiences</span>
        </div>
        {error && (
          <Notice tone="error" className="mt-5">
            {error}
          </Notice>
        )}
        <div className="mt-6 border-t border-line pt-5">
          <Button onClick={rate} disabled={loading} className="w-full">
            {loading ? "Nova is reviewing…" : "Rank my ECs"}
            {!loading && <ArrowRight size={15} />}
          </Button>
          <p className="fine-print mt-3 text-center">
            {storageWarning ?? "Your draft stays in this browser."}
          </p>
        </div>
      </section>
      <aside className="space-y-5 xl:sticky xl:top-24">
        <section
          ref={resultRef}
          tabIndex={-1}
          aria-label="Nova activity review"
          className="panel panel-pad stage-focus"
          aria-live="polite"
        >
          {loading ? (
            <LoadingState
              title="Finding the strength in your experiences…"
              description="Looking at depth, responsibility, and the difference you made."
            />
          ) : !result ? (
            <>
              <div className="empty-symbol">
                <Sprout size={25} />
              </div>
              <p className="eyebrow">A fresh perspective</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                It’s not just what you did.
                <br />
                It’s what you brought.
              </h2>
              <p className="body-copy mt-4">
                Nova will help you understand how your activities fit together
                and where you can make each one count.
              </p>
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-xs font-semibold">
                  Your review will include
                </h3>
                <ul className="feedback-list mt-2">
                  <li>A ranking of your activities by depth and impact.</li>
                  <li>Concrete ways to articulate your contribution.</li>
                  <li>
                    Gaps to work on, with your overall level carried into your
                    plan.
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <SectionHeading
                title="Your activity portfolio"
                action={
                  <span
                    className={`badge capitalize ${TIER[result.overallLevel]}`}
                  >
                    {result.overallLevel}
                  </span>
                }
              />
              <p className="body-copy text-foreground!">{result.summary}</p>
              <ol className="space-y-5">
                {result.ranked.map((item, index) => (
                  <li
                    className="border-t border-line pt-5"
                    key={`${item.name}-${index}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="folio-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="flex-1 text-sm font-semibold">
                        {item.name}
                      </h3>
                      <span className={`badge capitalize ${TIER[item.tier]}`}>
                        {item.tier}
                      </span>
                    </div>
                    <p className="body-copy mt-3 text-xs!">{item.why}</p>
                    <div className="mt-3 panel-inset p-4">
                      <p className="eyebrow mb-1">Make it count</p>
                      <p className="body-copy text-xs!">{item.leverage}</p>
                    </div>
                  </li>
                ))}
              </ol>
              {result.gaps.length > 0 && (
                <div className="coaching-sheet">
                  <h3>Room to grow</h3>
                  <ul className="feedback-list mt-2">
                    {result.gaps.map((gap, index) => (
                      <li key={index}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Link href="/planner" className="text-link">
                See how this fits your plan <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
        <p className="fine-print flex items-start gap-2 px-1">
          <Layers3 size={14} className="mt-1" />
          Advice for honest reflection, not a guarantee of admission. Your
          overall activity level is shared with the Planner and Programs.
        </p>
      </aside>
    </div>
  );
}
