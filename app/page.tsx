import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ClipboardList,
  Mic,
  PenLine,
  Sparkles,
  Sprout,
} from "lucide-react";
import { SIMULATOR_PROGRAMS } from "@/lib/data/prompts";
import { UNIVERSITIES } from "@/lib/data/programs";
import TrackedLink from "@/components/tracked-link";
import { Badge } from "@/components/ui";

const STATS = [
  { value: "645", label: "Programs tracked" },
  { value: "6,950", label: "Offers recorded" },
  { value: "92.9%", label: "Average admitted grade" },
];
const JOURNEY = [
  {
    number: "01",
    icon: BookOpen,
    title: "Find your direction.",
    body: "Explore Ontario programs, compare what they ask for, and bring your shortlist into one thoughtful plan.",
    links: [
      { href: "/vault", label: "Explore programs" },
      { href: "/planner", label: "Build your plan" },
    ],
  },
  {
    number: "02",
    icon: PenLine,
    title: "Make practice count.",
    body: "Get comfortable with timed written responses and mock interviews. Then use Nova’s feedback to make your next answer stronger.",
    links: [
      { href: "/simulator", label: "Practise writing" },
      { href: "/interview", label: "Try an interview" },
    ],
  },
  {
    number: "03",
    icon: Sprout,
    title: "See what you bring.",
    body: "Understand the impact of your activities, reflect on your progress, and choose one useful thing to improve next.",
    links: [
      { href: "/ec-rater", label: "Review your activities" },
      { href: "/analytics", label: "See your progress" },
    ],
  },
];

export default function Home() {
  const sample =
    SIMULATOR_PROGRAMS.find((program) => program.code === "queens_comm") ??
    SIMULATOR_PROGRAMS[0];
  const previewUniversity =
    UNIVERSITIES.find((university) => university.key === "waterloo") ??
    UNIVERSITIES[0];
  const previewProgram = previewUniversity.programs[0];
  return (
    <div className="home-container">
      <section className="home-hero">
        <div className="hero-layout">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> For
              Ontario’s next chapter
            </p>
            <h1 className="hero-headline">
              Your future is
              <br />
              taking shape.
              <br />
              <em>Let’s give it a plan.</em>
            </h1>
            <p className="hero-description">
              The workspace for Ontario university applicants. Find your
              programs, prepare your supplemental applications, and practise
              showing up as yourself.
            </p>
            <div className="hero-cta">
              <TrackedLink
                href="/planner"
                event="hero_cta"
                properties={{ cta: "plan" }}
                className="btn-primary"
              >
                Build my application plan <ArrowRight size={16} />
              </TrackedLink>
              <TrackedLink
                href="/vault"
                event="hero_cta"
                properties={{ cta: "programs" }}
                className="btn-secondary"
              >
                Explore programs
              </TrackedLink>
            </div>
            <p className="hero-note">
              Made for Grade 12. Built around the work that comes before
              “submit.” An independent resource — always verify details with
              OUAC and your university.
            </p>
          </div>
          <div className="product-preview">
            <div className="preview-window">
              <div className="preview-toolbar">
                <span className="preview-dot" />
                <span className="preview-dot" />
                <span className="preview-dot" />
                <span className="ml-auto text-muted">
                  accepted! / your workspace
                </span>
              </div>
              <div className="preview-content">
                <div className="flex items-center justify-between">
                  <p className="preview-route">Your application folio</p>
                  <Badge>Example workspace</Badge>
                </div>
                <h2>
                  A little more clarity.
                  <br />A clear next step.
                </h2>
                <div className="preview-program">
                  <span className="folio-number">01</span>
                  <div className="flex-1">
                    <p className="text-[10px] text-muted">
                      {previewUniversity.name}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">
                      {previewProgram.name}
                    </h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge tone="accent">
                        {previewProgram.avg} reference
                      </Badge>
                      <Badge>Supplemental required</Badge>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Research the programs that fit you",
                    "Check requirements and verified deadlines",
                    "Make time for a focused practice session",
                  ].map((task, index) => (
                    <div
                      className="flex items-center gap-3 text-[11px] text-secondary"
                      key={task}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border ${index === 0 ? "border-accent bg-accent text-white" : "border-line"}`}
                      >
                        {index === 0 && <Check size={11} />}
                      </span>
                      {task}
                    </div>
                  ))}
                </div>
                <div className="preview-note">
                  <Sparkles size={16} className="mt-0.5 text-accent" />
                  <div>
                    <p className="font-semibold text-accent!">
                      Meet Nova, your practice coach.
                    </p>
                    <p>
                      Specific feedback. Clear next steps. A stronger answer,
                      one attempt at a time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between px-1 text-[9px] text-secondary">
              <span>PLAN. PREPARE. REFLECT.</span>
              <ArrowDown size={13} />
            </div>
          </div>
        </div>
        <div className="hero-stats">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
          <p className="fine-print self-center">
            Historical, self-reported admission outcomes. Useful context, never
            a prediction of your result.
          </p>
        </div>
      </section>
      <section className="home-section" aria-labelledby="journey-heading">
        <div className="home-section-title">
          <div>
            <p className="eyebrow">A little less scattered</p>
            <h2 id="journey-heading">
              One journey.
              <br />
              Room for every moving part.
            </h2>
          </div>
          <p>
            From your first shortlist to your next practice response, keep your
            applications moving with purpose.
          </p>
        </div>
        <div>
          {JOURNEY.map((item) => (
            <div key={item.number} className="journey-row">
              <span className="journey-icon">
                <item.icon size={21} strokeWidth={1.6} />
              </span>
              <div>
                <p className="eyebrow mb-1">
                  {item.number} /{" "}
                  {item.number === "01"
                    ? "Plan"
                    : item.number === "02"
                      ? "Prepare"
                      : "Reflect"}
                </p>
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
              <div className="flex flex-col gap-3">
                {item.links.map((link) => (
                  <Link
                    href={link.href}
                    className="text-link text-xs!"
                    key={link.href}
                  >
                    {link.label}
                    <ArrowUpRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="home-section">
        <div className="practice-intro">
          <div>
            <p className="eyebrow">Practice with intention</p>
            <h2>
              A blank page feels
              <br />
              better with a little practice.
            </h2>
            <p className="body-copy mt-4">
              Meet the supplemental application before it meets you. Practise
              under real preparation and response limits, then get a clear
              score, useful feedback, and a model rewrite from Nova.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs text-secondary">
              <span className="flex items-center gap-2">
                <PenLine size={15} className="text-accent" />
                Timed writing
              </span>
              <span className="flex items-center gap-2">
                <Mic size={15} className="text-accent" />
                Voice or keyboard interviews
              </span>
            </div>
            <TrackedLink
              className="text-link mt-6"
              href="/simulator"
              event="sample_prompt_started"
            >
              Step into the practice studio <ArrowRight size={15} />
            </TrackedLink>
          </div>
          <div className="sample-question">
            <p className="eyebrow">Sample prompt · {sample.label}</p>
            <blockquote>{sample.prompts[0]}</blockquote>
            <div className="flex flex-wrap gap-2">
              <Badge>60s preparation</Badge>
              <Badge>10 min written response</Badge>
              <Badge tone="accent">Feedback / 100</Badge>
            </div>
            <p className="fine-print mt-4">
              Representative practice, not a current or official admissions
              question.
            </p>
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="grid gap-7 sm:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "References, with context.",
              text: "Program details and historical averages help you plan. University portals and OUAC remain the source of truth.",
            },
            {
              icon: CheckCheck,
              title: "Your own experiences matter.",
              text: "Nova helps you reflect and communicate. Feedback is a practice aid, not an admissions decision.",
            },
            {
              icon: ClipboardList,
              title: "A plan you can return to.",
              text: "Your planner stays in this browser. Sign in to keep your scored practice and progress together.",
            },
          ].map((item) => (
            <div key={item.title}>
              <item.icon
                size={21}
                className="mb-4 text-accent"
                strokeWidth={1.6}
              />
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="fine-print mt-2">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="home-closing border-t border-line">
        <div>
          <p className="eyebrow mb-3">Start where you are</p>
          <h2>
            You don’t need every answer.
            <br />
            Just a place to take the next step.
          </h2>
        </div>
        <TrackedLink
          href="/simulator"
          event="bottom_cta"
          properties={{ cta: "practice" }}
          className="btn-primary shrink-0"
        >
          Choose a practice prompt <ArrowRight size={16} />
        </TrackedLink>
      </section>
    </div>
  );
}
