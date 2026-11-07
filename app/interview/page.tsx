import MockInterview from '@/components/mock-interview';

export const metadata = {
  title: 'Mock Interview',
  description:
    'Practise program-focused university interview questions by voice or keyboard and receive a structured transcript review.',
};

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <MockInterview />
    </div>
  );
}
