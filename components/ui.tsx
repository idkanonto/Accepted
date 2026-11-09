import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ArrowRight, Check, Info, Loader2, TriangleAlert } from "lucide-react";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
}) {
  return (
    <button className={`btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Panel({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <section className={`panel ${className}`} {...props} />;
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
  className?: string;
}) {
  return <span className={`badge badge-${tone} ${className}`}>{children}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {action && <div className="page-actions">{action}</div>}
    </header>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Notice({
  children,
  tone = "info",
  className = "",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success";
  className?: string;
}) {
  const Icon =
    tone === "error" ? TriangleAlert : tone === "success" ? Check : Info;
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`notice notice-${tone} ${className}`}
    >
      <Icon size={17} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-symbol" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function LoadingState({
  title = "Getting things ready…",
  description,
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <Loader2
        className="animate-spin text-accent"
        size={24}
        aria-hidden="true"
      />
      <p>{title}</p>
      {description && <span>{description}</span>}
    </div>
  );
}

export function NextArrow() {
  return <ArrowRight size={16} aria-hidden="true" />;
}
