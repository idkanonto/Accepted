'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, LogOut } from 'lucide-react';
import { SITE } from '@/lib/site';
import { useAuth } from './auth-provider';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/planner', label: 'OUAC Planner' },
  { href: '/vault', label: 'Programs' },
  { href: '/simulator', label: 'Practice' },
  { href: '/interview', label: 'Mock Interview' },
  { href: '/analytics', label: 'Progress' },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, loading, openAuth, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-panel/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center gap-1.5 text-lg font-bold tracking-tight text-accent-soft">
            <span className="font-display">Accepted</span>
            <span className="rounded-sm bg-accent-deep px-1.5 py-0.5 text-[10px] font-semibold tracking-widest text-accent">
              ON
            </span>
          </span>
          <span className="hidden truncate border-l border-line pl-3 text-xs font-medium text-muted lg:inline-block">
            {SITE.tagline}
          </span>
        </Link>

        <div className="hidden items-center gap-4 xl:flex">
          <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm font-medium">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`whitespace-nowrap border-b-2 py-2 transition ${
                    active
                      ? 'border-accent text-accent'
                      : 'border-transparent text-muted hover:text-cream'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {loading ? null : user ? (
            <span className="flex items-center gap-3">
              <span className="hidden max-w-[160px] truncate text-xs text-muted 2xl:inline">
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 text-xs text-muted transition hover:text-cream"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </span>
          ) : (
            <button
              onClick={openAuth}
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-soft"
            >
              Sign in
            </button>
          )}

          <a
            href={SITE.feedbackForm}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-lg border border-line bg-ink px-3.5 py-2 text-xs font-semibold text-accent transition hover:border-accent/40 2xl:flex"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Rate Site Effectiveness
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 xl:hidden">
        <nav
          aria-label="Main navigation"
          className="flex min-w-0 items-center gap-1 overflow-x-auto"
        >
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${
                  active ? 'bg-accent-deep font-semibold text-accent' : 'text-muted'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        {!loading && (
          user ? (
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-ink hover:text-cream"
            >
              <LogOut className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={openAuth}
              className="shrink-0 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white"
            >
              Sign in
            </button>
          )
        )}
      </div>
    </header>
  );
}
