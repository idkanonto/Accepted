import { track } from '@vercel/analytics';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

/** Fire a custom event. Never throws — analytics must not break the app. */
export function trackEvent(name: string, properties: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return;
  try {
    track(name, properties);
  } catch {
    // ignore: analytics is best-effort
  }
}
