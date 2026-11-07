'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from './auth-provider';

/** AI tools render only for signed-in users. The API routes enforce this again server-side. */
export default function RequireAuth({ children, what }: { children: ReactNode; what: string }) {
  const { user, loading, openAuth } = useAuth();

  if (loading) return <p className="py-16 text-center text-sm text-muted">Loading…</p>;
  if (user) return <>{children}</>;

  return (
    <div className="panel mx-auto my-10 max-w-md space-y-4 p-8 text-center">
      <Lock className="mx-auto h-8 w-8 text-accent" />
      <h1 className="text-xl font-medium text-cream">Sign up to use {what}</h1>
      <p className="text-sm leading-6 text-muted">
        Feedback from Nova is free, but you need an account so your scores are saved and the
        free daily limit is shared fairly.
      </p>
      <button
        onClick={openAuth}
        className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-accent-soft"
      >
        Sign up or sign in
      </button>
    </div>
  );
}
