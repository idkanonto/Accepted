import { Suspense } from 'react';
import RequireAuth from '@/components/require-auth';
import Simulator from '@/components/simulator';
import { LoadingState, PageHeading } from '@/components/ui';

export const metadata = {
  title: 'Supp App Simulator',
  description:
    'Practise representative Ontario supplemental application prompts under strict timers and get specific written feedback.',
};

export default function SimulatorPage() {
  return (
    <div className="page-container">
      <PageHeading
        eyebrow="PREPARE & PRACTISE / SUPP APP SIMULATOR"
        title="Find the words that feel like you."
      >
        Practise representative Ontario supplemental prompts with strict prep and response timers.
        Get direct coaching on written answers. These are practice questions, not current or
        official admissions questions.
      </PageHeading>

      <RequireAuth what="the practice simulator" heading={false}>
        <Suspense fallback={<LoadingState label="Loading the simulator…" />}>
          <Simulator />
        </Suspense>
      </RequireAuth>
    </div>
  );
}
