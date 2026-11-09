"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, LockKeyhole } from "lucide-react";
import { useAuth } from "./auth-provider";
import { useHydrated } from "./use-hydrated";
import { trackEvent } from "@/lib/track";
import { Button, LoadingState, NextArrow } from "./ui";

export default function RequireAuth({
  children,
  what,
}: {
  children: ReactNode;
  what: string;
}) {
  const { user, loading, openAuth } = useAuth();
  const hydrated = useHydrated();
  if (!hydrated || loading)
    return (
      <div className="panel">
        <LoadingState title="Opening your workspace…" />
      </div>
    );
  if (user) return <>{children}</>;
  return (
    <section className="panel mx-auto max-w-3xl overflow-hidden">
      <div className="grid md:grid-cols-[1.1fr_1fr]">
        <div className="p-7 sm:p-10">
          <span className="empty-symbol">
            <LockKeyhole size={24} />
          </span>
          <p className="eyebrow">Your practice, kept personal</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Make room for
            <br />
            your next chapter.
          </h2>
          <p className="body-copy mt-4">
            Sign in to use {what}. Keep your feedback together and build on
            every practice session.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              trackEvent("gate_cta_clicked", { what });
              openAuth();
            }}
          >
            Sign up or sign in <NextArrow />
          </Button>
          <p className="fine-print mt-3">
            Nova feedback is free. An account keeps daily limits fair.
          </p>
        </div>
        <div className="flex flex-col justify-center border-t border-line bg-inset p-7 sm:p-10 md:border-l md:border-t-0">
          <p className="eyebrow">A workspace that grows with you</p>
          <ul className="mt-5 space-y-5">
            {[
              "Realistic preparation and response timers",
              "Specific feedback, strengths and next steps",
              "Your scores and progress, saved to your account",
            ].map((perk) => (
              <li
                key={perk}
                className="flex gap-3 text-[13px] leading-6 text-secondary"
              >
                <Check size={17} className="mt-1 text-accent" />
                {perk}
              </li>
            ))}
          </ul>
          <Link href="/vault" className="text-link mt-8">
            Explore programs first <NextArrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
