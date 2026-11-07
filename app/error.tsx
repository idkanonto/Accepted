'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/track';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
    trackEvent('page_error');
  }, [error]);

  return (
    <div className="mx-auto my-14 flex max-w-lg flex-col items-center rounded-xl border border-line bg-panel p-8 text-center shadow-sm">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-medium text-cream">The page could not finish loading</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        This is a problem on our side, not with your work. Try again — your saved practice and
        planner entries stay in this browser.
      </p>
      <button onClick={() => reset()} className="btn-primary mt-6">
        Try again
      </button>
    </div>
  );
}
