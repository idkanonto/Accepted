'use client';

import type { ReactNode } from 'react';
import { Check, Lock } from 'lucide-react';
import { useAuth } from './auth-provider';
import { trackEvent } from '@/lib/track';

/** AI tools render only for signed-in users. The API routes enforce this again server-side. */
export default function RequireAuth({ children, what }: { children: ReactNode; what: string }) {
  const { user, loading, openAuth } = useAuth();

  if (loading) return <p className="py-16 text-center text-sm text-muted">Loading…</p>;
  if (user) return <>{children}</>;

  const perks = [
    'Timed practice under the real supplemental limits',
    'A score, a verdict, and a model rewrite from Nova',
    'Results saved to your account and your daily limit shared fairly',
  ];

  return (
    <div className="mx-auto my-14 flex max-w-lg flex-col items-center rounded-xl border border-line bg-panel p-8 text-center shadow-sm">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-deep text-accent">
        <Lock className="h-5 w-5" />
      </span>
      <h1 className="mt-5 text-2xl font-medium text-cream">Sign up to use {what}</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Feedback from Nova is free, but you need an account so your scores are saved and the free
        daily limit is shared fairly.
      </p>
      <ul className="mt-5 space-y-2 text-left">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2 text-sm leading-6 text-cream/90">
            <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
            {perk}
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          trackEvent('gate_cta_clicked', { what });
          openAuth();
        }}
        className="btn-primary mt-6 w-full"
      >
        Sign up or sign in
      </button>
    </div>
  );
}
