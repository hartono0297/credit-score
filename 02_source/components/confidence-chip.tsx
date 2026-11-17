import { LOW_CONFIDENCE_THRESHOLD } from "@/lib/extraction";
import { formatDecimal } from "@/lib/format";

export function ConfidenceChip({ confidence }: { confidence: number }) {
  const low = confidence < LOW_CONFIDENCE_THRESHOLD;
  const percent = `${formatDecimal(confidence * 100, 0)}%`;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="sr-only">Confidence </span>
      <span
        className={`inline-flex min-h-6 items-center rounded-control border px-1.5 text-xs font-semibold ${
          low
            ? "border-warn-ink/40 bg-warn-bg text-warn-ink"
            : "border-grade-a/30 bg-ok-bg text-grade-a"
        }`}
      >
        {percent}
      </span>
      {low ? (
        <span className="text-xs font-semibold text-warn-ink">Perlu verifikasi</span>
      ) : null}
    </span>
  );
}
