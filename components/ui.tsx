import type { ReactNode } from 'react';
import { ArrowRight, Info, type LucideIcon } from 'lucide-react';

export function PageHeading({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading flex flex-wrap items-end justify-between gap-5">
      <div className="min-w-0">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="icon-tile">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="notice">
      <Info className="mt-0.5 h-4 w-4 text-muted" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function LoadingState({ label = 'Loading your workspace…' }: { label?: string }) {
  return (
    <div role="status" className="panel space-y-6 p-6 sm:p-8">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-5">
        <div className="skeleton h-3 w-24" />
        <div className="skeleton h-8 w-2/3 max-w-xs" />
        <div className="grid grid-cols-2 gap-4">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
        <div className="skeleton h-36 w-full" />
      </div>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function TextAction({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent">
      {children}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}
