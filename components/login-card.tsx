'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';
import AuthForm from './auth-form';

export default function LoginCard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-sm text-muted">Loading…</p>;
  }

  if (user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          You&apos;re signed in as{' '}
          <span className="font-medium text-cream">{user.email}</span>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-accent-soft"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return <AuthForm />;
}
