import { formatDecimal } from "@/lib/format";

// Sama dengan lib/extraction; disalin agar logika ekstraksi tidak ikut ke bundle client.
const LOW_CONFIDENCE_THRESHOLD = 0.8;

export function ConfidenceChip({ confidence }: { confidence: number }) {
  const low = confidence < LOW_CONFIDENCE_THRESHOLD;
  const percent = `${formatDecimal(confidence * 100, 0)}%`;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="sr-only">Confidence </span>
      <span
        className={`inline-flex min-h-6 items-center rounded-control px-2 text-xs font-semibold ${
          low
            ? "bg-warn-bg text-warn-ink"
            : "bg-ok-bg text-grade-a"
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
