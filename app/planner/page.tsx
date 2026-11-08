import Planner from '@/components/planner';

export const metadata = {
  title: 'OUAC & Chance Planner',
  description:
    'Organize Ontario university choices, track application steps and compare your average with broad competitive reference ranges.',
};

export default function PlannerPage() {
  return (
    <div className="page-container">
      <Planner />
    </div>
  );
}
