"use client";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import AuthForm from "./auth-form";
import { useHydrated } from "./use-hydrated";
import { LoadingState, Notice } from "./ui";

export default function LoginCard() {
  const { user, loading } = useAuth();
  const hydrated = useHydrated();
  if (!hydrated || loading)
    return <LoadingState title="Checking your account…" />;
  if (user)
    return (
      <div className="space-y-6">
        <Notice tone="success">You’re signed in as {user.email}.</Notice>
        <Link href="/planner" className="btn-primary w-full">
          Go to your planner
        </Link>
      </div>
    );
  return <AuthForm />;
}
