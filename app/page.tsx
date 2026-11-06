import Link from 'next/link';
import { BookOpen, Clock, Sparkles } from 'lucide-react';
import InstagramIcon from '@/components/instagram-icon';
import { SITE } from '@/lib/site';

const FEATURES = [
  {
    icon: Clock,
    title: 'Timed Simulation Practice',
    body: 'Simulate real university interview conditions like Kira Talent and written AIF tests. Practice with authentic prompts from Waterloo, U of T, McMaster, Queen’s, and more.',
  },
  {
    icon: BookOpen,
    title: 'Complete Program Vault',
    body: 'Instantly filter through every university program in Ontario requiring supplemental applications. Check competitive averages, specific formats, and official deadlines in one place.',
  },
  {
    icon: Sparkles,
    title: 'Nova AI Scoring',
    body: 'Written answers are scored 0–100 by Nova, the AI admissions evaluator: a direct verdict, what works, what to fix, and a model rewrite. Every attempt feeds your analytics.',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6 rounded-3xl border border-accent/40 bg-gradient-to-r from-accent-deep/20 via-panel to-panel p-8 text-center shadow-2xl sm:p-12">
          <div className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-soft">
            Ontario Grade 12 Admissions Hub
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-cream sm:text-5xl">
            Welcome to <span className="text-accent-soft">Accepted!</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Your ultimate companion for mastering Ontario university supplemental
            applications. Practice real past prompts under strict interview timers and
            explore competitive requirements across every major university program.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/simulator"
              className="flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-ink shadow-lg transition hover:bg-accent-soft"
            >
              <Clock className="h-4 w-4" />
              Start Supp App Simulator
            </Link>
            <Link
              href="/vault"
              className="flex items-center gap-2 rounded-xl border border-line bg-panel px-6 py-3 text-sm font-semibold text-cream transition hover:border-accent/50"
            >
              <BookOpen className="h-4 w-4" />
              Browse Program Vault
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="space-y-3 rounded-2xl border border-line bg-panel p-6 shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent-soft">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-cream">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-4xl px-4 pb-14 sm:px-6">
        <div className="space-y-3 rounded-2xl border border-line bg-panel p-6 text-center shadow-md">
          <h3 className="text-base font-bold text-cream">Have Questions or Want to Help Out?</h3>
          <p className="text-sm text-muted">
            Reach out directly via Instagram! We&apos;d love to connect with you.
          </p>
          <a
            href={SITE.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 px-5 py-2 text-sm font-medium text-white shadow-md transition hover:opacity-90"
          >
            <InstagramIcon className="h-4 w-4" />
            {SITE.instagramHandle}
          </a>
        </div>
      </section>
    </div>
  );
}
