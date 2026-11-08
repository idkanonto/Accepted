'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/track';

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
        else trackEvent('sign_in');
      } else {
        const { data, error } = await getSupabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(error.message);
        else {
          trackEvent('sign_up');
          if (!data.session) {
            setInfo('Account created — check your inbox for a confirmation link.');
          }
        }
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
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
      <div className="segmented !grid grid-cols-2" role="group" aria-label="Account access">
        <button
          type="button"
          aria-pressed={mode === 'signin'}
          onClick={() => setMode('signin')}
          className={`rounded-md py-2 transition ${
            mode === 'signin' ? 'bg-panel-2 font-semibold text-cream' : 'text-muted'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === 'signup'}
          onClick={() => setMode('signup')}
          className={`rounded-md py-2 transition ${
            mode === 'signup' ? 'bg-panel-2 font-semibold text-cream' : 'text-muted'
          }`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-5" aria-busy={loading}>
        <div>
          <label htmlFor="auth-email" className="label">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.ca"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="auth-password" className="label">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            name="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="input"
          />
        </div>

        {mode === 'signin' && (
          <div className="text-right">
            <button
              type="button"
              onClick={forgotPassword}
              className="min-h-11 text-xs font-medium text-accent transition-colors hover:text-accent-soft"
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="feedback-error">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="feedback-success">
            {info}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
