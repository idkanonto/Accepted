import { ArrowUpRight } from "lucide-react";
import InstagramIcon from "./instagram-icon";
import { SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          © 2026 Accepted! <span className="mx-1">·</span> An independent
          Ontario admissions resource.
        </p>
        <div className="footer-links">
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5"
          >
            <InstagramIcon className="h-3 w-3" />
            {SITE.instagramHandle}
          </a>
          <a
            href={SITE.feedbackForm}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1"
          >
            Share feedback <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    </footer>
  );
}
