'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, LogOut } from 'lucide-react';
import { SITE } from '@/lib/site';
import { useAuth } from './auth-provider';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/simulator', label: 'Supp App Simulator' },
  { href: '/vault', label: 'Program Vault' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, loading, openAuth, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 bg-accent px-3 py-1.5 text-lg font-extrabold tracking-wider text-ink shadow">
            <span>Accepted!</span>
            <span className="bg-accent-deep px-1.5 py-0.5 text-xs font-semibold text-accent-soft">
              ON
            </span>
          </span>
          <span className="hidden rounded-full border border-line px-3 py-1 text-xs font-medium text-muted md:inline-block">
            {SITE.tagline}
          </span>
        </Link>

        <div className="hidden items-center gap-5 md:flex">
          <nav className="flex items-center gap-6 text-sm font-medium">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`border-b-2 pb-1 transition ${
                    active
                      ? 'border-accent text-accent-soft'
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
              <span className="hidden max-w-[160px] truncate text-xs text-muted lg:inline">
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
              className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-ink transition hover:bg-accent-soft"
            >
              Sign in
            </button>
          )}

          <a
            href={SITE.feedbackForm}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-accent/60 bg-accent-deep/20 px-3.5 py-1.5 text-xs font-semibold text-accent-soft transition hover:bg-accent-deep/40"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Rate Site Effectiveness
          </a>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto border-t border-line px-4 py-2 md:hidden">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap px-3 py-1.5 text-sm ${
                active ? 'font-semibold text-accent-soft' : 'text-muted'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {!loading && !user && (
          <button
            onClick={openAuth}
            className="whitespace-nowrap px-3 py-1.5 text-sm font-semibold text-accent-soft"
          >
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}
