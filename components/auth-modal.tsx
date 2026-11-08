'use client';

import { X } from 'lucide-react';
import { useAuth } from './auth-provider';
import AuthForm from './auth-form';
import Dialog from './dialog';
import Brand from './brand';

export default function AuthModal() {
  const { authOpen, closeAuth } = useAuth();
  return (
    <Dialog open={authOpen} onClose={closeAuth} labelledBy="auth-dialog-title">
      <div className="mb-7 flex items-center justify-between">
        <Brand />
        <button onClick={closeAuth} aria-label="Close sign in" className="icon-button">
          <X className="h-5 w-5" />
        </button>
      </div>
      <h2 id="auth-dialog-title" className="text-2xl font-semibold tracking-tight">
        Your next chapter awaits.
      </h2>
      <p className="mb-6 mt-2 text-sm leading-6 text-muted">
        Sign in to save your practice and pick up where you left off.
      </p>
      <AuthForm />
    </Dialog>
  );
}
