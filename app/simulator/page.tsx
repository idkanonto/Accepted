import { Suspense } from 'react';
import RequireAuth from '@/components/require-auth';
import Simulator from '@/components/simulator';

export const metadata = {
  title: 'Supp App Simulator',
  description:
    'Practise representative Ontario supplemental application prompts under strict timers and get specific written feedback.',
};

export default function SimulatorPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 rounded-2xl border border-line bg-panel p-6">
        <div>
          <h1 className="text-2xl font-bold text-cream">Supplemental Application Practice</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted">
            Practise representative supplemental prompts from Ontario program areas
            under strict timers, with direct coaching on written answers. Prompts are
            for preparation and are not represented as current or official admissions questions.
          </p>
        </div>
      </div>

      <RequireAuth what="the practice simulator">
        <Suspense fallback={<p className="text-muted">Loading the simulator…</p>}>
          <Simulator />
        </Suspense>
      </RequireAuth>
    </div>
  );
}
