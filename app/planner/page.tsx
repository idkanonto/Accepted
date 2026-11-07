import Planner from '@/components/planner';

export const metadata = {
  title: 'OUAC & Chance Planner',
  description:
    'Organize Ontario university choices, track application steps and compare your average with broad competitive reference ranges.',
};

export default function PlannerPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <Planner />
    </div>
  );
}
