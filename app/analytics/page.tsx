import RequireAuth from '@/components/require-auth';
import AnalyticsDashboard from '@/components/analytics-dashboard';

export const metadata = {
  title: 'Nova Analytics',
  description:
    'Your practice progress: scores by program, weekly trend, and an AI breakdown of where to focus next.',
};

export default function AnalyticsPage() {
  return (
    <div className="page-container">
      <RequireAuth what="your progress">
        <AnalyticsDashboard />
      </RequireAuth>
    </div>
  );
}
