import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChartNoAxesCombined,
  Feather,
  Mic2,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { SIMULATOR_PROGRAMS } from '@/lib/data/prompts';
import { UNIVERSITIES } from '@/lib/data/programs';
import TrackedLink from '@/components/tracked-link';
import { TextAction } from '@/components/ui';

const TOOLS = [
  {
    href: '/simulator',
    icon: Feather,
    title: 'Find your words.',
    description: 'Timed supplemental prompts. Specific feedback. A clearer next draft.',
    label: 'Supp App Simulator',
  },
  {
    href: '/interview',
    icon: Mic2,
    title: 'Get comfortable being you.',
    description: 'Practise by voice or keyboard and reflect on what you want to say.',
    label: 'Mock Interview',
  },
  {
    href: '/ec-rater',
    icon: UserRound,
    title: 'See the story in your activities.',
    description: 'Understand your impact and bring real experiences into your application.',
    label: 'Activity Rater',
  },
  {
    href: '/analytics',
    icon: ChartNoAxesCombined,
    title: 'Make every attempt useful.',
    description: 'See your practice record, recognise patterns, and choose your next focus.',
    label: 'Nova Analytics',
  },
];

export default function Home() {
  const sample = SIMULATOR_PROGRAMS.find((p) => p.code === 'queens_comm') ?? SIMULATOR_PROGRAMS[0];

  return (
    <>
      <section className="home-section home-hero">
        <div>
          <p className="eyebrow mb-5 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            YOUR NEXT CHAPTER STARTS HERE
          </p>
          <h1 className="hero-title">
            Big ambitions.
            <br />A clearer
            <br />
            <em>way forward.</em>
          </h1>
          <p className="hero-description">
            Your Ontario university journey, thoughtfully organised. Explore programs, plan your
            applications, and practise telling your story.
          </p>
          <div className="hero-actions">
            <TrackedLink
              href="/planner"
              event="hero_cta"
              properties={{ cta: 'plan' }}
              className="btn-primary"
            >
              Build my application plan
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </TrackedLink>
            <TrackedLink
              href="/vault"
              event="hero_cta"
              properties={{ cta: 'programs' }}
              className="btn-ghost"
            >
              Explore programs
            </TrackedLink>
          </div>
          <p className="hero-footnote">
            <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            Start exploring. No account needed.
          </p>
        </div>
        <div className="hero-folio">
          <div className="folio-spine" aria-hidden="true" />
          <div className="folio-preview">
            <div className="folio-preview-top">
              <div>
                <p className="eyebrow">THE ACCEPTED WORKSPACE</p>
                <h2>A little more prepared.</h2>
              </div>
              <span className="icon-tile">
                <BookOpen className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <div className="journey-step">
              <span className="number-label">01</span>
              <div>
                <strong>Find your direction</strong>
                <p>Explore {UNIVERSITIES.length} Ontario universities.</p>
              </div>
              <BookOpen className="mt-1 h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            <div className="journey-step">
              <span className="number-label">02</span>
              <div>
                <strong>Make room for what matters</strong>
                <p>A shortlist. Your next steps. One place.</p>
              </div>
              <CalendarDays className="mt-1 h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            <div className="journey-step">
              <span className="number-label">03</span>
              <div>
                <strong>Practise with purpose</strong>
                <p>Turn your own experiences into stronger answers.</p>
              </div>
              <Feather className="mt-1 h-4 w-4 text-muted" aria-hidden="true" />
            </div>
            <div className="folio-prompt">
              <p className="text-[10px] font-semibold tracking-wider text-accent">
                A MOMENT TO THINK · SAMPLE PROMPT
              </p>
              <blockquote>{sample.prompts[0]}</blockquote>
              <TrackedLink
                href="/simulator"
                event="sample_prompt_started"
                className="mt-4 flex min-h-10 items-center justify-between gap-3 text-xs font-semibold text-accent"
              >
                Try a practice prompt
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </TrackedLink>
            </div>
            <p className="mt-3 text-[10px] leading-4 text-muted">
              Representative practice prompt, not an official admissions question.
            </p>
          </div>
        </div>
      </section>

      <section className="home-section" aria-label="Ontario program references">
        <div className="home-context">
          <p>
            Built around Ontario admissions.
            <br />
            <strong className="font-medium text-cream">Explore program requirements from:</strong>
          </p>
          <div className="university-wordmarks">
            <span>Waterloo</span>
            <span>University of Toronto</span>
            <span>Queen’s</span>
            <span>McMaster</span>
            <span className="!text-xs !font-normal !tracking-normal">and more</span>
          </div>
        </div>
      </section>

      <section className="home-section home-tools">
        <div className="home-tools-heading">
          <div>
            <p className="eyebrow">FROM “WHERE DO I START?” TO “WHAT’S NEXT?”</p>
            <h2>
              Less scattered.
              <br />
              More prepared.
            </h2>
          </div>
          <p>You don’t need to figure everything out today. Just take the next useful step.</p>
        </div>
        <div className="home-directory">
          <div className="directory-feature">
            <span className="icon-tile">
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3>
              Your plans deserve
              <br />a place of their own.
            </h3>
            <p>
              Build a program shortlist, compare your average with reference ranges, and keep the
              moving parts of your application in view.
            </p>
            <Link href="/planner" className="mt-6 inline-flex min-h-11 items-center">
              <TextAction>Open the OUAC Planner</TextAction>
            </Link>
            <div className="mt-8 border-t border-line pt-6">
              <p className="eyebrow !mt-0">RESEARCH BEFORE YOU DECIDE</p>
              <p className="!mt-2">
                Browse supplemental formats, deadlines and competitive averages in the Program
                Vault.
              </p>
              <Link href="/vault" className="mt-3 inline-flex min-h-11 items-center">
                <TextAction>Get to know your programs</TextAction>
              </Link>
            </div>
          </div>
          <div className="directory-links">
            {TOOLS.map((tool) => (
              <Link key={tool.href} href={tool.href} className="directory-link">
                <span className="icon-tile !h-10 !w-10 !bg-panel">
                  <tool.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {tool.label}
                  </span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-cta">
          <div>
            <p className="eyebrow !mt-0 mb-3 inline-flex items-center gap-2 !text-accent">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              PRACTICE, WITH PERSPECTIVE
            </p>
            <h2>
              One program. One response.
              <br />
              One useful improvement.
            </h2>
            <p>
              Nova helps you reflect on your writing and activities with specific feedback. It’s a
              practice aid, not an admissions decision. Your story stays your own.
            </p>
          </div>
          <TrackedLink
            href="/simulator"
            event="bottom_cta"
            properties={{ cta: 'practice' }}
            className="btn-primary shrink-0"
          >
            Start practising
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </TrackedLink>
        </div>
        <p className="mx-auto mb-10 max-w-2xl text-center text-xs leading-6 text-muted">
          Accepted is an independent preparation resource. Always confirm admission requirements,
          prerequisites and deadlines with the university and OUAC. Reference averages are
          estimates, not admission guarantees.
        </p>
      </section>
    </>
  );
}
