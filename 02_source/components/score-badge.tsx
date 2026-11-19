import { formatScore } from "@/lib/format";
import { ScoreScale } from "@/components/score-scale";
import type { Grade } from "@/lib/types";

const GRADE_META: Record<Grade, { label: string; ink: string }> = {
  A: { label: "Sangat baik", ink: "text-grade-a" },
  B: { label: "Baik", ink: "text-grade-b" },
  C: { label: "Cukup", ink: "text-grade-c" },
  D: { label: "Berisiko", ink: "text-grade-d" },
  E: { label: "Tinggi risiko", ink: "text-grade-e" },
};

export function GradeChip({ grade, size = "sm" }: { grade: Grade; size?: "sm" | "lg" }) {
  const meta = GRADE_META[grade];

  return (
    <span
      aria-label={`Grade ${grade}, ${meta.label}`}
      className={`font-semibold ${meta.ink} ${size === "sm" ? "text-xs" : "text-base"}`}
    >
      {size === "sm" ? grade : `${grade}, ${meta.label}`}
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
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="text-5xl font-semibold leading-none tracking-tight text-ink md:text-[56px]">
            {formatScore(score)}
          </p>
          <p className="text-[13px] text-muted">dari 1000</p>
          <GradeChip grade={grade} size="lg" />
        </div>
        <ScoreScale score={score} grade={grade} size="lg" />
      </div>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <span className="inline-flex items-baseline gap-2">
        <span className="text-lg font-semibold leading-none text-ink">{formatScore(score)}</span>
        <GradeChip grade={grade} />
      </span>
      <ScoreScale score={score} grade={grade} size="sm" />
    </span>
  );
}
