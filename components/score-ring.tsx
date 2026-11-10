export default function ScoreRing({
  score,
  size = 92,
}: {
  score: number;
  size?: number;
}) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const tone =
    clamped >= 75
      ? "text-accent"
      : clamped >= 55
        ? "text-warning"
        : "text-danger";
  return (
    <div
      role="img"
      aria-label={`Practice score ${clamped} out of 100`}
      className="score-figure relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-line"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          className={`score-ring-progress ${tone}`}
          stroke="currentColor"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-semibold leading-none tracking-tight">
          {clamped}
        </span>
        <span className="mt-1.5 text-[9px] text-muted">OUT OF 100</span>
      </div>
    </div>
  );
}
