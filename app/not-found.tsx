import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="page-container">
      <section className="panel mx-auto my-10 max-w-xl p-8 text-center sm:p-12">
        <span className="icon-tile">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="eyebrow mt-6">404 / A DIFFERENT DIRECTION</p>
        <h1 className="mt-3 text-3xl font-semibold">Let’s find your way back.</h1>
        <p className="mt-4 text-sm leading-7 text-muted">
          This page isn’t here. Your next step still is.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Back to overview
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/vault" className="btn-ghost">
            Explore programs
          </Link>
        </div>
      </section>
    </div>
  );
}
