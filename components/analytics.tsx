'use client';

import { Analytics as VercelAnalytics, type BeforeSend, type BeforeSendEvent } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useMemo } from 'react';
import { useAuth } from './auth-provider';

/** Stable anonymous id so dashboards can build per-student funnels without raw ids. */
function visitorHash(id: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `u${(hash >>> 0).toString(36)}`;
}

/**
 * Page views, web vitals and the `beforeSend` enrichment live here so every
 * event carries a stable anonymous visitor id.
 */
export default function Analytics() {
  const { user, loading } = useAuth();
  const visitor = useMemo(() => (user ? visitorHash(user.id) : null), [user]);

  // Custom-event properties are transmitted as event data, so the anonymous
  // visitor id belongs there rather than as an unknown top-level field.
  const beforeSend: BeforeSend = (event) => {
    if (!visitor || event.type !== 'event') return event;
    const runtime = event as BeforeSendEvent & {
      payload?: { name: string; data?: Record<string, unknown> };
    };
    return {
      ...runtime,
      payload: {
        ...runtime.payload,
        data: { ...runtime.payload?.data, visitor },
      },
    } as unknown as BeforeSendEvent;
  };

  // Wait for the session so the first pageview already carries the visitor id.
  if (loading) return null;

  return (
    <>
      <VercelAnalytics beforeSend={beforeSend} />
      <SpeedInsights />
    </>
  );
}
