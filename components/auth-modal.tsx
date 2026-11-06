'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from './auth-provider';
import AuthForm from './auth-form';

export default function AuthModal() {
  const { authOpen, closeAuth } = useAuth();

  useEffect(() => {
    if (!authOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [authOpen]);

  if (!authOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={closeAuth}
    >
      <div
        className="panel w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-cream">
            Sign in to Accepted!
          </h2>
          <button
            onClick={closeAuth}
            aria-label="Close"
            className="text-muted transition hover:text-cream"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
