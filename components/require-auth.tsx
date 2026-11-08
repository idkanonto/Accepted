'use client';

import type { ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  Feather,
  Lock,
  Mic2,
  ChartNoAxesCombined,
  UserRound,
} from 'lucide-react';
import { useAuth } from './auth-provider';
import { trackEvent } from '@/lib/track';
import { LoadingState, PageHeading } from './ui';

const FEATURES = {
  'the practice simulator': {
    title: 'Find the words that feel like you.',
    eyebrow: 'SUPP APP SIMULATOR',
    icon: Feather,
    description: 'Prepare with timed prompts and specific feedback on your written responses.',
    note: 'Timed practice. Thoughtful feedback. Your own voice.',
    perks: [
      'Representative prompts with prep and response timers',
      'A practice score, specific strengths, and a model rewrite',
      'Saved evaluations and a shared free daily limit',
    ],
  },
  'mock interviews': {
    title: 'A little practice. A little more you.',
    eyebrow: 'MOCK INTERVIEW',
    icon: Mic2,
    description:
      'Rehearse program-focused questions by voice or keyboard, then reflect with a structured transcript review.',
    note: 'A quiet space to get comfortable with your story.',
    perks: [
      'Three program-focused practice questions',
      'Optional voice transcription or a typed response',
      'Structured feedback on substance and clarity',
    ],
  },
  'the EC rater': {
    title: 'There’s a story in what you do.',
    eyebrow: 'ACTIVITY RATER',
    icon: UserRound,
    description:
      'Look beyond the activity list. Understand the depth, responsibility, and impact of your extracurriculars.',
    note: 'Real experience. Clearer evidence. Stronger reflection.',
    perks: [
      'Describe up to eight activities and your role',
      'See how depth, responsibility and impact come through',
      'Bring your activity profile into the Planner',
    ],
  },
  'your progress': {
    title: 'Every attempt is a step forward.',
    eyebrow: 'NOVA ANALYTICS',
    icon: ChartNoAxesCombined,
    description: 'Your practice record, scores, and next areas of focus, together in one view.',
    note: 'Understand your progress, one attempt at a time.',
    perks: [
      'Scores and practice history saved to your account',
      'Program comparisons and your weekly practice trend',
      'A Nova breakdown of strengths and next steps',
    ],
  },
};

/** Presentation only. Authentication and API enforcement are unchanged. */
export default function RequireAuth({
  children,
  what,
  heading = true,
}: {
  children: ReactNode;
  what: string;
  heading?: boolean;
}) {
  const { user, loading, openAuth } = useAuth();
  if (loading) return <LoadingState label="Opening your workspace…" />;
  if (user) return <>{children}</>;
  const feature = FEATURES[what as keyof typeof FEATURES] ?? FEATURES['the practice simulator'];
  return (
    <>
      {heading && (
        <PageHeading eyebrow={`YOUR WORKSPACE / ${feature.eyebrow}`} title={feature.title}>
          {feature.description}
        </PageHeading>
      )}
      <section className="panel mx-auto grid max-w-5xl overflow-hidden md:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col justify-between bg-accent-deep/50 p-6 sm:p-10">
          <div>
            <span className="icon-tile !bg-panel">
              <feature.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="eyebrow mt-10 !text-accent">A SPACE FOR YOUR NEXT STEP</p>
            <h2 className="mt-3 max-w-sm text-3xl font-semibold leading-tight tracking-tight">
              {feature.note}
            </h2>
          </div>
          <p className="mt-8 text-xs leading-6 text-muted">
            Independent preparation. No admission guarantees.
            <br />A little clarity before the real thing.
          </p>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          <span className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-muted">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Your personal workspace
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">Start with a free account.</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            Sign in to use {what}. Your account keeps practice scores together and helps share the
            free daily feedback limit fairly.
          </p>
          <ul className="mt-6 space-y-4">
            {feature.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-sm leading-6 text-cream">
                <Check className="mt-1 h-4 w-4 text-accent" aria-hidden="true" />
                {perk}
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              trackEvent('gate_cta_clicked', { what });
              openAuth();
            }}
            className="btn-primary mt-8 w-full"
          >
            Sign up or sign in
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="mt-3 text-center text-xs text-muted">
            Already have an account? You’re in the right place.
          </p>
        </div>
      </section>
    </>
  );
}
