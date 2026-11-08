'use client';

import { ArrowLeft, RotateCcw, TriangleAlert } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="page-container">
      <section className="panel mx-auto my-10 max-w-xl p-6 text-center sm:p-10">
        <span className="icon-tile !bg-mortuum !text-rose">
          <TriangleAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">LET’S GET YOU BACK ON TRACK</p>
        <h1 className="mt-3 text-3xl font-semibold">A pause, not the end.</h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          Something went wrong loading this part of Accepted. Try again, or return to the overview
          to choose your next step.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn-primary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link href="/" className="btn-ghost">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to overview
          </Link>
        </div>
      </section>
    </div>
  );
}
