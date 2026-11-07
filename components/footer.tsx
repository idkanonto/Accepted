import { ClipboardList } from 'lucide-react';
import InstagramIcon from './instagram-icon';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-panel">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted">
          <span>© 2026 Accepted! Ontario Supp App Hub. Designed for Grade 12 students.</span>
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-accent-soft hover:underline"
          >
            <InstagramIcon className="h-3.5 w-3.5" />
            {SITE.instagramHandle}
          </a>
        </div>
        <a
          href={SITE.feedbackForm}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-cream"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          Help us improve — rate the site
        </a>
      </div>
    </footer>
  );
}
