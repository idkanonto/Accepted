'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from './auth-provider';

const LINKS = [
  { href: '/planner', label: 'Planner' },
  { href: '/vault', label: 'Programs' },
  { href: '/simulator', label: 'Practice' },
  { href: '/interview', label: 'Interview' },
  { href: '/ec-rater', label: 'ECs' },
  { href: '/analytics', label: 'Progress' },
];

export default function Nav() {
  const pathname = usePathname();
  const { user, loading, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname === href ? 'bg-panel-2 text-cream' : 'text-muted hover:text-cream'
    }`;

  const account = loading ? null : user ? (
    <button
      onClick={signOut}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted transition hover:text-cream"
    >
      <LogOut className="h-4 w-4" /> Sign out
    </button>
  ) : (
    <button onClick={openAuth} className="btn-primary px-4 py-2">
      Sign in
    </button>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1.5">
          <span className="font-display text-xl font-semibold tracking-tight text-accent">
            Accepted!
          </span>
          <span className="rounded border border-accent/40 px-1 text-[10px] font-semibold tracking-wider text-accent">
            ON
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? 'page' : undefined}
              className={linkClass(l.href)}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">{account}</div>

        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="rounded-lg p-2 text-cream md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          aria-label="Mobile navigation"
          className="flex flex-col gap-1 border-t border-line px-4 py-3 md:hidden"
        >
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={pathname === l.href ? 'page' : undefined}
              className={linkClass(l.href)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2">{account}</div>
        </nav>
      )}
    </header>
  );
}
