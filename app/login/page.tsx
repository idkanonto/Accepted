import type { Metadata } from 'next';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import LoginCard from '@/components/login-card';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Accepted! to save your practice and get scored feedback.',
};

export default function LoginPage() {
  return (
    <div className="page-container">
      <Link
        href="/"
        className="mb-8 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-muted"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to overview
      </Link>
      <div className="mx-auto grid max-w-5xl items-center gap-10 py-6 lg:grid-cols-[1fr_420px] lg:gap-20 lg:py-12">
        <div>
          <p className="eyebrow">YOUR ACCEPTED WORKSPACE</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            A fresh perspective.
            <br />
            <span className="text-accent">A familiar place.</span>
          </h1>
          <p className="mt-6 max-w-sm text-base leading-8 text-muted">
            Pick up your practice, see your progress, and keep moving toward the programs that
            matter to you.
          </p>
          <ul className="mt-8 space-y-4 text-sm text-muted">
            {[
              'Your feedback, saved in one place',
              'Practice that builds on what you learn',
              'A clearer next step for your application',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check className="h-4 w-4 text-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <section className="panel p-6 sm:p-8" aria-label="Your account">
          <h2 className="text-2xl font-semibold tracking-tight">Welcome to Accepted.</h2>
          <p className="mb-7 mt-2 text-sm leading-6 text-muted">
            Your next chapter starts with you.
          </p>
          <LoginCard />
        </section>
      </div>
    </div>
  );
}
