import type { Metadata } from 'next';
import LoginCard from '@/components/login-card';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Accepted! to save your practice and get scored feedback.',
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="panel p-6">
        <LoginCard />
      </div>
    </div>
  );
}
