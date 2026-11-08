'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';
import AuthForm from './auth-form';
import { LoadingState } from './ui';

export default function LoginCard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingState label="Checking your account…" />;
  }

  if (user) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted">
          You&apos;re signed in as{' '}
          <span className="break-all font-medium text-cream">{user.email}</span>.
        </p>
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
      </div>
    );
  }

  return <AuthForm />;
}
