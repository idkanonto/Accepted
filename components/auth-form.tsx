'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import GoogleIcon from './google-icon';

export default function AuthForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) setError(error.message);
      } else {
        const { data, error } = await getSupabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(error.message);
        else if (!data.session) {
          setInfo('Account created — check your inbox for a confirmation link.');
        }
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    setError(null);
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }

  async function forgotPassword() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError('Enter your email first, then click Forgot password?.');
      return;
    }
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setInfo('If that account exists, a reset link is on its way.');
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-ink p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`rounded-md py-2 transition ${
            mode === 'signin' ? 'bg-panel-2 font-semibold text-cream' : 'text-muted'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded-md py-2 transition ${
            mode === 'signup' ? 'bg-panel-2 font-semibold text-cream' : 'text-muted'
          }`}
        >
          Create account
        </button>
      </div>

      <button
        type="button"
        onClick={google}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-ink py-2.5 text-sm font-medium text-cream transition hover:border-accent/50"
      >
        <GoogleIcon className="h-4 w-4" />
        Continue with Google
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="auth-email" className="mb-1 block text-xs font-medium text-muted">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.ca"
            className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-cream outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="mb-1 block text-xs font-medium text-muted">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="w-full rounded-lg border border-line bg-ink px-3 py-2.5 text-sm text-cream outline-none focus:border-accent"
          />
        </div>

        {mode === 'signin' && (
          <div className="text-right">
            <button
              type="button"
              onClick={forgotPassword}
              className="text-xs text-muted transition hover:text-accent-soft"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p className="border-l-2 border-rose bg-rose/10 px-3 py-2 text-sm text-rose">
            {error}
          </p>
        )}
        {info && (
          <p className="border-l-2 border-accent bg-accent/10 px-3 py-2 text-sm text-accent-soft">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-ink transition hover:bg-accent-soft disabled:opacity-60"
        >
          {loading
            ? 'Please wait…'
            : mode === 'signin'
              ? 'Sign in'
              : 'Create account'}
        </button>
      </form>
    </div>
  );
}
