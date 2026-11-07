'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackEvent, type AnalyticsProps } from '@/lib/track';

type TrackedLinkProps = ComponentProps<typeof Link> & {
  event: string;
  properties?: AnalyticsProps;
};

/** A Next.js Link that reports a custom Vercel Analytics event on click. */
export default function TrackedLink({ event, properties, ...props }: TrackedLinkProps) {
  return <Link {...props} onClick={() => trackEvent(event, properties)} />;
}
