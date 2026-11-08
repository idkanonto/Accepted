export default function ScoreRing({ score, size = 92 }: { score: number; size?: number }) {
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = c - (clamped / 100) * c;

  const tone = clamped >= 75 ? 'text-accent' : clamped >= 55 ? 'text-gold' : 'text-rose';

  return (
    <div
      role="img"
      aria-label={`Practice score ${clamped} out of 100`}
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          className="stroke-line"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={tone}
          stroke="currentColor"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-3xl font-semibold tabular-nums tracking-tight text-cream">
          {clamped}
        </span>
        <span className="mt-1 text-[9px] font-medium tracking-wide text-muted">/ 100</span>
      </div>
    </div>
  );
}
