"use client";
import { useId, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/track";
import Tabs from "./tabs";
import { Button, NextArrow, Notice } from "./ui";

export default function AuthForm() {
  const id = useId();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await getSupabase().auth.signInWithPassword({
          email,
          password,
        });
        if (error) setError(error.message);
        else trackEvent("sign_in");
      } else {
        const { data, error } = await getSupabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) setError(error.message);
        else {
          trackEvent("sign_up");
          if (!data.session)
            setInfo(
              "Account created — check your inbox for a confirmation link.",
            );
        }
      }
    } catch {
      setError("We couldn’t connect to sign-in. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }
  async function forgotPassword() {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email first, then select Forgot password.");
      return;
    }
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: window.location.origin },
      );
      if (error) setError(error.message);
      else setInfo("If that account exists, a reset link is on its way.");
    } catch {
      setError(
        "We couldn’t send the reset link. Please try again in a moment.",
      );
    }
  }
  return (
    <div className="space-y-6">
      <Tabs
        label="Account access"
        items={[
          { id: "signin", label: "Sign in" },
          { id: "signup", label: "Create account" },
        ]}
        value={mode}
        onChange={(value) => {
          setMode(value);
          setError(null);
          setInfo(null);
        }}
        panelId={`${id}-form`}
      />
      <form
        id={`${id}-form`}
        role="tabpanel"
        aria-label={mode === "signin" ? "Sign in" : "Create account"}
        onSubmit={submit}
        className="space-y-4"
      >
        <div>
          <label htmlFor={`${id}-email`} className="field-label">
            Email address
          </label>
          <input
            id={`${id}-email`}
            className="field"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@school.ca"
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={`${id}-password`} className="field-label">
              Password
            </label>
            {mode === "signin" && (
              <button
                type="button"
                onClick={forgotPassword}
                className="min-h-11 text-xs text-accent"
              >
                Forgot password?
              </button>
            )}
          </div>
          <input
            id={`${id}-password`}
            className="field"
            type="password"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        {error && <Notice tone="error">{error}</Notice>}
        {info && (
          <div role="status">
            <Notice tone="success">{info}</Notice>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Please wait…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
          {!loading && <NextArrow />}
        </Button>
      </form>
      <p className="fine-print text-center">
        Your planning. Your practice. Your own pace.
      </p>
    </div>
  );
}
