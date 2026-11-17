import { formatDecimal } from "@/lib/format";
import type { Factor } from "@/lib/types";

const DIRECTION_TEXT: Record<Factor["direction"], string> = {
  positive: "menaikkan skor",
  negative: "menurunkan skor",
  neutral: "tidak mengubah skor",
};

function signedPoints(points: number): string {
  return `${points > 0 ? "+" : ""}${formatDecimal(points, 0)}`;
}

export function FactorBar({ factor, maxAbs }: { factor: Factor; maxAbs: number }) {
  const weight = Math.max(0, Math.min(Math.abs(factor.points) / Math.max(maxAbs, 1), 1));
  const width = `${weight * 50}%`;
  const pointsClass =
    factor.direction === "positive"
      ? "text-accent"
      : factor.direction === "negative"
        ? "text-grade-d"
        : "text-muted";

  return (
    <div
      role="group"
      aria-label={`${factor.label}: ${signedPoints(factor.points)} poin, ${DIRECTION_TEXT[factor.direction]}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-medium text-ink">{factor.label}</p>
        <p className="text-sm">
          <span className={`font-semibold ${pointsClass}`}>{signedPoints(factor.points)}</span>{" "}
          <span className="text-xs text-muted">{DIRECTION_TEXT[factor.direction]}</span>
        </p>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-[2px] bg-surface-muted" aria-hidden="true">
        <span className="absolute inset-y-0 left-1/2 w-px bg-line-strong" />
        {factor.direction === "positive" ? (
          <span className="absolute inset-y-0 left-1/2 rounded-[2px] bg-accent" style={{ width }} />
        ) : null}
        {factor.direction === "negative" ? (
          <span className="absolute inset-y-0 right-1/2 rounded-[2px] bg-grade-d" style={{ width }} />
        ) : null}
      </div>
      <p className="mt-1.5 text-xs text-muted">{factor.detail}</p>
    </div>
  );
}
