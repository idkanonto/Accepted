import Link from "next/link";
import { averageRange, suppSignals, type EcLevel } from "@/lib/position";
import { Badge } from "./ui";

const MIN = 70;
const MAX = 100;
const pos = (n: number) =>
  Math.max(0, Math.min(100, ((n - MIN) / (MAX - MIN)) * 100));

export function RangeBar({
  label,
  average,
}: {
  label: string;
  average?: number | null;
}) {
  const range = averageRange(label);
  if (!range) return null;
  const left = pos(range[0]);
  const right = label.includes("+") ? 100 : pos(range[1]);
  const text = `Reference range ${label}${average != null ? `, your average ${average}%` : ""}`;
  return (
    <div role="img" aria-label={text} className="min-w-0 w-full max-w-[240px]">
      <div className="range-track">
        <span
          className="range-band"
          style={{ left: `${left}%`, width: `${Math.max(right - left, 2)}%` }}
        />
        {average != null && (
          <span
            className="range-marker"
            style={{ left: `calc(${pos(average)}% - 1px)` }}
          />
        )}
      </div>
      <div className="mt-2 flex justify-between gap-2 font-mono text-[9px] text-muted">
        <span>{MIN}%</span>
        {average != null && <span className="text-accent">You {average}%</span>}
        <span>{MAX}%</span>
      </div>
    </div>
  );
}

export function ProgramTags({ req }: { req: string }) {
  const { longAnswer, background } = suppSignals(req);
  if (!longAnswer && !background) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {longAnswer && <Badge>Long answer</Badge>}
      {background && <Badge>Background &amp; ECs</Badge>}
    </div>
  );
}
const EC_NOTE: Record<EcLevel, string> = {
  light:
    "ECs are assessed here and yours rate light right now. Build depth before you apply.",
  solid:
    "ECs are assessed here. Yours rate solid; show clearer impact and responsibility.",
  strong:
    "ECs are assessed here. Yours rate strong, which helps this application.",
  standout:
    "ECs are assessed here. Yours rate standout, a real strength for this application.",
};
export function EcFit({ req, level }: { req: string; level: EcLevel | null }) {
  if (!suppSignals(req).background)
    return (
      <p className="fine-print">No ECs profile in the listed requirements.</p>
    );
  if (!level)
    return (
      <p className="fine-print">
        ECs are assessed here.{" "}
        <Link
          href="/ec-rater"
          className="text-accent underline underline-offset-4"
        >
          Rate your ECs
        </Link>{" "}
        to see how they fit.
      </p>
    );
  return <p className="fine-print">{EC_NOTE[level]}</p>;
}
