import { formatScore } from "@/lib/format";
import type { Grade } from "@/lib/types";

const GRADE_META: Record<Grade, { label: string; ink: string }> = {
  A: { label: "Sangat baik", ink: "var(--grade-a)" },
  B: { label: "Baik", ink: "var(--grade-b)" },
  C: { label: "Cukup", ink: "var(--grade-c)" },
  D: { label: "Berisiko", ink: "var(--grade-d)" },
  E: { label: "Tinggi risiko", ink: "var(--grade-e)" },
};

export function GradeChip({ grade, size = "sm" }: { grade: Grade; size?: "sm" | "lg" }) {
  const meta = GRADE_META[grade];
  const compact = size === "sm";

  return (
    <span
      aria-label={`Grade ${grade}, ${meta.label}`}
      className={`inline-flex items-center justify-center rounded-control border font-semibold ${
        compact ? "min-h-6 min-w-7 px-1.5 text-xs" : "min-h-8 px-2.5 text-sm"
      }`}
      style={{
        color: meta.ink,
        backgroundColor: `color-mix(in srgb, ${meta.ink} 10%, var(--surface))`,
        borderColor: `color-mix(in srgb, ${meta.ink} 32%, var(--surface))`,
      }}
    >
      {compact ? grade : `${grade}, ${meta.label}`}
    </span>
  );
}

export function ScoreBadge({
  score,
  grade,
  size = "sm",
}: {
  score: number;
  grade: Grade;
  size?: "sm" | "lg";
}) {
  if (size === "lg") {
    return (
      <div className="flex flex-wrap items-end gap-3">
        <p className="text-[48px] font-bold leading-[1.05] tracking-tight text-ink">
          {formatScore(score)}
        </p>
        <p className="pb-1 text-sm font-medium text-muted">dari 1000</p>
        <div className="pb-1">
          <GradeChip grade={grade} size="lg" />
        </div>
      </div>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-xl font-semibold leading-none text-ink">{formatScore(score)}</span>
      <GradeChip grade={grade} />
    </span>
  );
}
