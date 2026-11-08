'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Feather,
  House,
  LogOut,
  Menu,
  Mic2,
  PanelLeft,
  UserRound,
  X,
} from 'lucide-react';
import { useAuth } from './auth-provider';
import Brand from './brand';
import Dialog from './dialog';

const LINKS = [
  {
    href: '/vault',
    label: 'Program Vault',
    icon: BookOpen,
    group: 'Discover & plan',
    short: 'Programs',
  },
  {
    href: '/planner',
    label: 'OUAC Planner',
    icon: CalendarDays,
    group: 'Discover & plan',
    short: 'Planner',
  },
  {
    href: '/simulator',
    label: 'Supp App Simulator',
    icon: Feather,
    group: 'Prepare & practise',
    short: 'Writing',
  },
  {
    href: '/interview',
    label: 'Mock Interview',
    icon: Mic2,
    group: 'Prepare & practise',
    short: 'Interview',
  },
  {
    href: '/ec-rater',
    label: 'Activity Rater',
    icon: UserRound,
    group: 'Prepare & practise',
    short: 'Activities',
  },
  {
    href: '/analytics',
    label: 'Nova Analytics',
    icon: ChartNoAxesCombined,
    group: 'Reflect & improve',
    short: 'Progress',
  },
];
const GROUPS = ['Discover & plan', 'Prepare & practise', 'Reflect & improve'];

export default function Nav() {
  const pathname = usePathname();
  const { user, loading, openAuth, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const home = pathname === '/';
  const current = LINKS.find((link) => link.href === pathname);

  useEffect(() => setOpen(false), [pathname]);

  const account = loading ? (
    <span className="skeleton block h-10 w-20" aria-label="Loading account" />
  ) : user ? (
    <button onClick={signOut} className="btn-ghost" aria-label="Sign out">
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>Sign out</span>
    </button>
  ) : (
    <button onClick={openAuth} className={home ? 'btn-primary' : 'btn-ghost'}>
      Sign in
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );

  const navigation = (
    <>
      <Link
        href="/"
        className="nav-link"
        aria-current={home ? 'page' : undefined}
        onClick={() => setOpen(false)}
      >
        <House aria-hidden="true" />
        Overview
      </Link>
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="nav-group-label">{group}</p>
          {LINKS.filter((link) => link.group === group).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              aria-current={pathname === link.href ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              <link.icon aria-hidden="true" />
              {link.label}
            </Link>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {home ? (
        <header className="landing-header">
          <div className="landing-header-inner">
            <Brand />
            <nav aria-label="Main navigation" className="landing-links">
              <Link href="/vault">Explore programs</Link>
              <Link href="/planner">Plan your applications</Link>
              <Link href="/simulator">Practise</Link>
            </nav>
            <div className="landing-account">{account}</div>
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation"
              aria-haspopup="dialog"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>
      ) : (
        <>
          <aside className="desktop-sidebar">
            <Brand />
            <nav aria-label="Main navigation">{navigation}</nav>
            <div className="sidebar-bottom">
              <div className="sidebar-note">
                <span className="mb-2 flex items-center gap-2 text-xs font-semibold">
                  <CircleHelp className="h-4 w-4 text-accent" aria-hidden="true" />A little clarity,
                  every day.
                </span>
                <p>Start with one program. Make your next application step a little easier.</p>
              </div>
              {user && (
                <Link href="/login" className="sidebar-account">
                  <span className="account-avatar">
                    {user.email?.charAt(0).toUpperCase() ?? 'A'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-cream">Your workspace</p>
                    <p className="truncate text-[11px] text-muted" title={user.email}>
                      {user.email}
                    </p>
                  </div>
                </Link>
              )}
              <p className="px-3 text-[10px] text-muted">Made for Ontario applicants</p>
            </div>
          </aside>
          <header className="workspace-header">
            <div className="breadcrumb">
              <Link href="/" aria-label="Go to overview">
                <House className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <ChevronRight className="h-3 w-3 text-muted/60" aria-hidden="true" />
              <span>Workspace</span>
              <ChevronRight className="h-3 w-3 text-muted/60" aria-hidden="true" />
              <strong>
                {current?.label ?? (pathname === '/login' ? 'Your account' : 'Accepted')}
              </strong>
            </div>
            <div className="mobile-brand">
              <Brand />
            </div>
            <div className="header-meta">
              <span className="workspace-badge">Ontario admissions workspace</span>
              {account}
              <button
                className="icon-button mobile-menu-button"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
                aria-haspopup="dialog"
              >
                <PanelLeft className="h-5 w-5" />
              </button>
            </div>
          </header>
          <nav aria-label="Quick navigation" className="mobile-bottom-nav">
            <Link href="/vault" aria-current={pathname === '/vault' ? 'page' : undefined}>
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              Programs
            </Link>
            <Link href="/planner" aria-current={pathname === '/planner' ? 'page' : undefined}>
              <CalendarDays className="h-5 w-5" aria-hidden="true" />
              Planner
            </Link>
            <Link href="/simulator" aria-current={pathname === '/simulator' ? 'page' : undefined}>
              <Feather className="h-5 w-5" aria-hidden="true" />
              Practise
            </Link>
            <button onClick={() => setOpen(true)} aria-label="More tools" aria-haspopup="dialog">
              <Menu className="h-5 w-5" aria-hidden="true" />
              More
            </button>
          </nav>
        </>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="navigation-title"
        className="menu-dialog"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="navigation-title" className="text-lg font-semibold">
            Your application workspace
          </h2>
          <button
            className="icon-button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="All tools">{navigation}</nav>
        <div className="mt-6 border-t border-line pt-5">
          {loading ? null : user ? (
            <div className="flex items-center justify-between gap-3">
              <Link
                href="/login"
                className="min-w-0 truncate text-xs text-muted"
                onClick={() => setOpen(false)}
              >
                {user.email}
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="btn-ghost"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setOpen(false);
                openAuth();
              }}
              className="btn-primary w-full"
            >
              Sign in to your workspace
              <ArrowUpRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </Dialog>
    </>
  );
}
