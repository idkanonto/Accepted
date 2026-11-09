"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Search, SlidersHorizontal } from "lucide-react";
import { UNIVERSITIES } from "@/lib/data/programs";
import {
  readPlannerAverage,
  readEcLevel,
  suppSignals,
  type EcLevel,
} from "@/lib/position";
import { EcFit, ProgramTags, RangeBar } from "./program-signals";
import { trackEvent } from "@/lib/track";
import { Badge, Button, EmptyState, PageHeader } from "./ui";

const PROGRAMS = UNIVERSITIES.flatMap((university) =>
  university.programs.map((program) => ({
    ...program,
    university: university.name,
    universityKey: university.key,
    universityShort: university.short,
  })),
);
export default function Vault() {
  const [uniKey, setUniKey] = useState("all");
  const [query, setQuery] = useState("");
  const [requirement, setRequirement] = useState("all");
  const [average, setAverage] = useState<number | null>(null);
  const [ecLevel, setEcLevel] = useState<EcLevel | null>(null);
  useEffect(() => {
    setAverage(readPlannerAverage());
    setEcLevel(readEcLevel());
  }, []);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROGRAMS.filter((program) => {
      const signals = suppSignals(program.req);
      return (
        (uniKey === "all" || program.universityKey === uniKey) &&
        (!q ||
          `${program.name} ${program.university} ${program.req} ${program.deadline}`
            .toLowerCase()
            .includes(q)) &&
        (requirement === "all" ||
          (requirement === "written" && signals.longAnswer) ||
          (requirement === "profile" && signals.background) ||
          (requirement === "interview" && /video|interview/i.test(program.req)))
      );
    });
  }, [uniKey, query, requirement]);
  const practice = (program: (typeof PROGRAMS)[number]) => (
    <Link
      href={`/simulator?program=${program.code}`}
      onClick={() =>
        trackEvent("practice_clicked", {
          code: program.code,
          program: program.name,
        })
      }
      className="text-link text-xs!"
      aria-label={`Practise ${program.name}`}
    >
      Practise <ArrowRight size={14} />
    </Link>
  );
  return (
    <div className="reveal">
      <PageHeader
        eyebrow="Plan / Program vault"
        title="Find a program. See the possibilities."
        description="A clearer view of Ontario’s supplemental applications. Compare what each program asks, then give yourself room to prepare."
        action={
          <Badge>
            <BookOpen size={13} />
            {UNIVERSITIES.length} universities
          </Badge>
        }
      />
      <div className="panel panel-pad">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="search-field flex-1">
            <Search size={17} />
            <input
              type="search"
              aria-label="Search programs and requirements"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Program, university, or requirement…"
              className="field"
            />
          </div>
          <div className="relative sm:w-56">
            <label className="sr-only" htmlFor="vault-requirement">
              Filter by requirement
            </label>
            <select
              id="vault-requirement"
              className="field"
              value={requirement}
              onChange={(event) => setRequirement(event.target.value)}
            >
              <option value="all">All requirements</option>
              <option value="written">Long answer / written</option>
              <option value="profile">Background &amp; ECs</option>
              <option value="interview">Interview / video</option>
            </select>
          </div>
        </div>
        <div
          className="university-filter"
          role="group"
          aria-label="Choose a university"
        >
          <button
            aria-pressed={uniKey === "all"}
            onClick={() => setUniKey("all")}
          >
            All universities
          </button>
          {UNIVERSITIES.map((university) => (
            <button
              key={university.key}
              onClick={() => setUniKey(university.key)}
              aria-pressed={uniKey === university.key}
            >
              {university.short}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="fine-print" aria-live="polite">
            <strong className="font-semibold text-foreground">
              {rows.length} programs
            </strong>{" "}
            match your selection
          </p>
          <p className="fine-print">
            {average == null ? (
              <Link href="/planner" className="text-link text-xs!">
                Set your average to compare ranges <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                Your saved average{" "}
                <strong className="font-mono font-medium text-accent">
                  {average}%
                </strong>{" "}
                is marked on each range.
              </>
            )}
          </p>
        </div>
      </div>
      <div className="mt-6 panel overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={<SlidersHorizontal />}
            title="A different search might open a door."
            description={
              <>
                No programs match “{query || "your selected filters"}”. Try a
                broader search or another university.
              </>
            }
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setUniKey("all");
                  setRequirement("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="hidden xl:block table-wrap">
              <table className="data-table">
                <caption className="sr-only">
                  Ontario supplemental program requirements and competitive
                  reference ranges
                </caption>
                <thead>
                  <tr>
                    <th className="w-[24%]">University &amp; program</th>
                    <th className="w-[20%]">Competitive reference</th>
                    <th className="w-[30%]">Supplemental requirements</th>
                    <th>Deadline</th>
                    <th>
                      <span className="sr-only">Practice</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((program) => (
                    <tr key={`${program.universityKey}-${program.name}`}>
                      <td>
                        <p className="mb-2 text-[10px] text-muted">
                          {program.university}
                        </p>
                        <h2 className="text-[13px] font-semibold leading-6 tracking-normal">
                          {program.name}
                        </h2>
                      </td>
                      <td>
                        <span className="text-sm font-semibold">
                          {program.avg}
                        </span>
                        <div className="mt-4">
                          <RangeBar label={program.avg} average={average} />
                        </div>
                      </td>
                      <td>
                        <p className="mb-3 text-[11px] leading-6 text-secondary">
                          {program.req}
                        </p>
                        <ProgramTags req={program.req} />
                        <div className="mt-3">
                          <EcFit req={program.req} level={ecLevel} />
                        </div>
                      </td>
                      <td className="text-xs text-secondary">
                        {program.deadline}
                      </td>
                      <td>{practice(program)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid md:grid-cols-2 xl:hidden">
              {rows.map((program, index) => (
                <article
                  key={`${program.universityKey}-${program.name}`}
                  className="border-b border-line p-5 md:odd:border-r"
                >
                  <div className="flex items-start gap-3">
                    <span className="folio-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-[10px] text-muted">
                        {program.university}
                      </p>
                      <h2 className="mt-1 text-base font-semibold leading-6 tracking-tight">
                        {program.name}
                      </h2>
                    </div>
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold">{program.avg}</span>
                    <div className="w-40">
                      <RangeBar label={program.avg} average={average} />
                    </div>
                  </div>
                  <p className="body-copy mt-4 text-xs!">{program.req}</p>
                  <div className="mt-3">
                    <ProgramTags req={program.req} />
                  </div>
                  <div className="mt-3">
                    <EcFit req={program.req} level={ecLevel} />
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="text-[10px] text-muted">
                        Deadline reference
                      </p>
                      <p className="mt-1 text-xs">{program.deadline}</p>
                    </div>
                    {practice(program)}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
      <p className="fine-print mt-5 flex items-start gap-2">
        <BookOpen size={14} className="mt-1" />
        Planning references, not admission guarantees. Verify requirements and
        deadlines directly. Practice prompts are representative, never official
        admissions questions.
      </p>
    </div>
  );
}
