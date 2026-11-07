import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Mic2,
  Target,
} from 'lucide-react';

const PATHWAYS = [
  {
    number: '01',
    icon: CalendarDays,
    title: 'Plan your applications',
    body: 'Keep OUAC choices, deadlines and next steps in one calm, practical workspace.',
    href: '/planner',
    action: 'Open your planner',
  },
  {
    number: '02',
    icon: BookOpen,
    title: 'Know what each program asks',
    body: 'Compare Ontario programs, their supplemental formats and the official details to verify.',
    href: '/vault',
    action: 'Explore programs',
  },
  {
    number: '03',
    icon: ClipboardCheck,
    title: 'Build a stronger written response',
    body: 'Work from a focused prompt, then get specific feedback you can apply to your next draft.',
    href: '/simulator',
    action: 'Practise writing',
  },
  {
    number: '04',
    icon: Mic2,
    title: 'Practise speaking out loud',
    body: 'Run a voice-based mock interview with timed questions and a structured review.',
    href: '/interview',
    action: 'Try a mock interview',
  },
];

export default function Home() {
  return (
    <div className="pb-14">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
        <div className="relative overflow-hidden rounded-[2rem] border border-line bg-panel px-6 py-10 shadow-sm sm:px-10 sm:py-14 lg:px-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 h-96 w-96 rounded-full bg-accent-deep/70 blur-3xl"
          />
          <div className="relative max-w-3xl">
            <p className="eyebrow">A clearer path to your next step</p>
            <h1 className="mt-5 max-w-3xl text-4xl font-medium leading-tight tracking-tight text-cream sm:text-5xl lg:text-6xl">
              Make your application <span className="text-accent">feel like yours.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              A practical workspace for Ontario applicants: organize your choices,
              understand supplemental applications, and practise the parts that take
              more than one try.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/planner"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-soft"
              >
                Build my application plan <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/vault"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-panel px-5 py-3 text-sm font-semibold text-cream transition hover:border-accent/50 hover:bg-ink"
              >
                Browse programs
              </Link>
            </div>
            <p className="mt-6 text-xs leading-5 text-muted">
              Independent preparation resource. Always confirm admission requirements
              and deadlines with the university and OUAC.
            </p>
          </div>
          <div className="relative mt-10 grid grid-cols-2 gap-3 border-t border-line pt-6 sm:mt-12 sm:max-w-2xl sm:grid-cols-3">
            {[
              ['Program research', 'Compare formats'],
              ['Application planning', 'Track next steps'],
              ['Practice', 'Learn by doing'],
            ].map(([label, detail]) => (
              <div key={label} className="py-2">
                <p className="text-sm font-semibold text-cream">{label}</p>
                <p className="mt-1 text-xs text-muted">{detail}</p>
              </div>
            ))}
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
            Research, prepare, practise and reflect. Move between tools without
            losing sight of the application you are building.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PATHWAYS.map((item) => (
            <article
              key={item.number}
              className="group flex min-h-64 flex-col rounded-2xl border border-line bg-panel p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-muted">
                  {item.number}
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-deep text-accent">
                  <item.icon className="h-5 w-5" />
                </span>
              </div>
              <h3 className="mt-7 text-xl font-medium text-cream">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.body}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent transition group-hover:gap-3"
              >
                {item.action} <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 rounded-2xl bg-[#314f3b] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9e7d4]">
              Thoughtful practice beats guesswork
            </p>
            <h2 className="mt-3 text-2xl font-medium sm:text-3xl">
              Start with one program. Make one useful improvement.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/80">
              Feedback is a practice aid, not an admissions decision. Your strongest
              answers still come from your own experiences and reflection.
            </p>
          </div>
          <Link
            href="/simulator"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#314f3b] transition hover:bg-[#edf2e8]"
          >
            Choose a practice prompt <Target className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
