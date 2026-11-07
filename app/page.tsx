import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Mic2,
  Target,
} from 'lucide-react';
import { SIMULATOR_PROGRAMS } from '@/lib/data/prompts';
import TrackedLink from '@/components/tracked-link';

const PATHWAYS = [
  {
    icon: CalendarDays,
    title: 'Plan your applications',
    body: 'Keep OUAC choices, deadlines, historical grades and next steps in one practical workspace.',
    href: '/planner',
    action: 'Open your planner',
  },
  {
    icon: BookOpen,
    title: 'Know what each program asks',
    body: 'Compare Ontario programs, their supplemental formats and the details to verify.',
    href: '/vault',
    action: 'Explore programs',
  },
  {
    icon: ClipboardCheck,
    title: 'Build a stronger written response',
    body: 'Work from a focused prompt, then get specific feedback you can apply to your next draft.',
    href: '/simulator',
    action: 'Practise writing',
  },
  {
    icon: Mic2,
    title: 'Practise speaking out loud',
    body: 'Run a voice-based mock interview with timed questions and a structured review.',
    href: '/interview',
    action: 'Try a mock interview',
  },
];

const STATS = [
  { value: '645', label: 'Programs tracked' },
  { value: '6,950', label: 'Offers recorded' },
  { value: '92.9%', label: 'Average admitted grade' },
];

export default function Home() {
  const sample = SIMULATOR_PROGRAMS.find((p) => p.code === 'queens_comm') ?? SIMULATOR_PROGRAMS[0];

  return (
    <div className="pb-14">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
        <div className="relative overflow-hidden rounded-2xl border border-line bg-panel px-6 py-10 shadow-sm sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent/0 via-accent to-accent/0"
          />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-center">
            <div className="max-w-2xl">
              <p className="eyebrow">Ontario Grade 12 admissions hub</p>
              <h1 className="mt-5 text-4xl font-medium leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-6xl">
                Practise the part of the application that counts.
              </h1>
              <p className="mt-6 text-base leading-7 text-muted sm:text-lg">
                A practical workspace for Ontario applicants: organise your choices, understand
                supplemental applications, and practise the parts that take more than one try.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <TrackedLink
                  href="/planner"
                  event="hero_cta"
                  properties={{ cta: 'plan' }}
                  className="btn-primary"
                >
                  Build my application plan <ArrowRight className="h-4 w-4" />
                </TrackedLink>
                <TrackedLink
                  href="/vault"
                  event="hero_cta"
                  properties={{ cta: 'programs' }}
                  className="btn-ghost"
                >
                  Browse programs
                </TrackedLink>
              </div>
              <p className="mt-6 text-xs leading-5 text-muted">
                Independent preparation resource. Always confirm admission requirements and deadlines
                with the university and OUAC.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-ink p-6">
              <p className="eyebrow">Sample prompt · {sample.label}</p>
              <p className="mt-4 text-lg leading-7 text-cream">{sample.prompts[0]}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="chip">30s prep</span>
                <span className="chip">2 min response</span>
                <span className="chip">Scored 0–100</span>
              </div>
              <TrackedLink
                href="/simulator"
                event="sample_prompt_started"
                className="btn-ghost mt-6 w-full"
              >
                Start practising
              </TrackedLink>
              <p className="mt-3 text-center text-xs leading-5 text-muted">
                Representative practice prompt, not an official question.
              </p>
            </div>
          </div>

          <div className="relative mt-10 border-t border-line pt-6">
            <div className="grid max-w-2xl grid-cols-3 gap-4">
              {STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-semibold text-accent sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Your application, in order</p>
            <h2 className="mt-2 text-3xl font-medium text-cream">A useful place to begin</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted">
            Research, prepare, practise and reflect. Move between tools without losing sight of the
            application you are building.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PATHWAYS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex min-h-64 flex-col rounded-xl border border-line bg-panel p-5 transition hover:border-accent/40 hover:bg-panel-2 sm:p-6"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-deep text-accent">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-7 text-xl font-medium text-cream">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.body}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent transition group-hover:gap-3">
                {item.action} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 rounded-xl border border-accent/25 bg-accent-deep/20 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <p className="eyebrow">Thoughtful practice beats guesswork</p>
            <h2 className="mt-3 text-2xl font-medium text-cream sm:text-3xl">
              Start with one program. Make one useful improvement.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Feedback is a practice aid, not an admissions decision. Your strongest answers still
              come from your own experiences and reflection.
            </p>
          </div>
          <TrackedLink
            href="/simulator"
            event="bottom_cta"
            properties={{ cta: 'practice' }}
            className="btn-primary shrink-0"
          >
            Choose a practice prompt <Target className="h-4 w-4" />
          </TrackedLink>
        </div>
      </section>
    </div>
  );
}
