import { ArrowUpRight } from 'lucide-react';
import InstagramIcon from './instagram-icon';
import { SITE } from '@/lib/site';

export default function Footer() {
  return (
    <footer className="shell-footer">
      <div className="footer-inner">
        <p>
          © 2026 Accepted! <span className="mx-1 text-muted/40">/</span> Made for Ontario Grade 12
          applicants.
        </p>
        <div className="footer-links">
          <a href={SITE.instagram} target="_blank" rel="noreferrer">
            <InstagramIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {SITE.instagramHandle}
          </a>
          <a href={SITE.feedbackForm} target="_blank" rel="noreferrer">
            Help us improve
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
