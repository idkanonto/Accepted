import RequireAuth from '@/components/require-auth';
import MockInterview from '@/components/mock-interview';

export const metadata = {
  title: 'Mock Interview',
  description:
    'Practise program-focused university interview questions by voice or keyboard and receive a structured transcript review.',
};

export default function InterviewPage() {
  return (
    <div className="page-container">
      <RequireAuth what="mock interviews">
        <MockInterview />
      </RequireAuth>
    </div>
  );
}
