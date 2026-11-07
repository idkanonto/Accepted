import Link from 'next/link';
import { averageRange, suppSignals, type EcLevel } from '@/lib/position';

const MIN = 70;
const MAX = 100;
const pos = (n: number) => Math.max(0, Math.min(100, ((n - MIN) / (MAX - MIN)) * 100));

/** Grade range as a band on a 70-100% scale, with the student's average as a marker. */
export function RangeBar({ label, average }: { label: string; average?: number | null }) {
  const range = averageRange(label);
  if (!range) return null;
  const left = pos(range[0]);
  const right = label.includes('+') ? 100 : pos(range[1]);
  const text = `Reference range ${label}${average != null ? `, your average ${average}%` : ''}`;
  return (
    <div role="img" aria-label={text} className="min-w-[140px]">
      <div className="relative h-2 rounded-full bg-line">
        <div
          className="absolute h-full rounded-full bg-accent"
          style={{ left: `${left}%`, width: `${Math.max(right - left, 2)}%` }}
        />
        {average != null && (
          <div
            className="absolute -top-1 h-4 w-1 rounded bg-cream ring-2 ring-ink"
            style={{ left: `calc(${pos(average)}% - 2px)` }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{MIN}%</span>
        {average != null && <span className="text-cream">You {average}%</span>}
        <span>{MAX}%</span>
      </div>
    </div>
  );
}

export function ProgramTags({ req }: { req: string }) {
  const { longAnswer, background } = suppSignals(req);
  if (!longAnswer && !background) return null;
  const chip = 'rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-accent-soft';
  return (
    <div className="flex flex-wrap gap-1.5">
      {longAnswer && <span className={chip}>Long answer</span>}
      {background && <span className={chip}>Background &amp; ECs</span>}
    </div>
  );
}

const EC_NOTE: Record<EcLevel, string> = {
  light: 'ECs are assessed here and yours rate light right now. Build depth before you apply.',
  solid: 'ECs are assessed here. Yours rate solid; show clearer impact and responsibility.',
  strong: 'ECs are assessed here. Yours rate strong, which helps this application.',
  standout: 'ECs are assessed here. Yours rate standout, a real strength for this application.',
};

export function EcFit({ req, level }: { req: string; level: EcLevel | null }) {
  if (!suppSignals(req).background) {
    return <p className="text-xs text-muted">No ECs profile in the listed requirements.</p>;
  }
  if (!level) {
    return (
      <p className="text-xs text-muted">
        ECs are assessed here.{' '}
        <Link href="/ec-rater" className="font-semibold text-accent hover:underline">
          Rate your ECs
        </Link>{' '}
        to see how they fit.
      </p>
    );
  }
  return <p className="text-xs text-muted">{EC_NOTE[level]}</p>;
}
