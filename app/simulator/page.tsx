import { Suspense } from 'react';
import { MessageSquareWarning } from 'lucide-react';
import Simulator from '@/components/simulator';
import { SITE } from '@/lib/site';

export const metadata = {
  title: 'Supp App Simulator',
  description:
    'Practice real Ontario university supplemental application prompts under strict prep and response timers, and get written answers scored by Nova.',
};

export default function SimulatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-accent/30 bg-gradient-to-r from-accent-deep/20 to-panel p-6 shadow-lg md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-cream">Timed Supp App Simulator</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Practice with real prompts from Waterloo, U of T, McMaster, Queen&apos;s,
            Ivey, Schulich, and TMU under strict timers.
          </p>
        </div>
        <a
          href={SITE.feedbackForm}
          target="_blank"
          rel="noreferrer"
          className="flex shrink-0 items-center gap-2 rounded-xl border border-accent/40 bg-panel px-4 py-2.5 text-xs font-medium text-accent-soft transition hover:bg-panel-2"
        >
          <MessageSquareWarning className="h-4 w-4" />
          Provide Feedback on Simulator
        </a>
      </div>

      <Suspense fallback={<p className="text-muted">Loading the simulator…</p>}>
        <Simulator />
      </Suspense>
    </div>
  );
}
