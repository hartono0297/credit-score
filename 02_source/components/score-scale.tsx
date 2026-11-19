import { scaleMarkerPercent } from "@/lib/format";
import type { Grade } from "@/lib/types";

export const GRADE_BANDS: { grade: Grade; from: number; to: number }[] = [
  { grade: "E", from: 0, to: 499 },
  { grade: "D", from: 500, to: 599 },
  { grade: "C", from: 600, to: 699 },
  { grade: "B", from: 700, to: 799 },
  { grade: "A", from: 800, to: 1000 },
];

const BAND_CLASS: Record<Grade, string> = {
  A: "bg-band-a",
  B: "bg-band-b",
  C: "bg-band-c",
  D: "bg-band-d",
  E: "bg-band-e",
};

const BOUNDARIES = [0, 500, 600, 700, 800, 1000];

export function ScoreScale({
  score,
  grade,
  size,
}: {
  score: number;
  grade: Grade;
  size: "sm" | "lg";
}) {
  const large = size === "lg";
  const marker = scaleMarkerPercent(score);

  return (
    <div
      {...(large
        ? { role: "img", "aria-label": `Skala skor ${score} dari 1000, grade ${grade}` }
        : { "aria-hidden": true })}
      className={large ? "w-full" : "w-[110px]"}
    >
      <div className="relative">
        <div className={`flex ${large ? "h-2 gap-0.5" : "h-1.5 gap-px"}`}>
          {GRADE_BANDS.map((band) => (
            <span
              key={band.grade}
              className={`rounded-sm ${large || band.grade === grade ? BAND_CLASS[band.grade] : "bg-band-idle"}`}
              style={{ flexGrow: band.to - band.from + 1, flexBasis: 0 }}
            />
          ))}
        </div>
        {large && (
          // translateX memakai persentase yang sama dengan left agar penanda tidak keluar dari bar di 0 dan 1000.
          <span
            className="absolute -top-1 h-4 w-0.5 bg-ink"
            style={{ left: `${marker}%`, transform: `translateX(-${marker}%)` }}
          />
        )}
      </div>
      {large && (
        // Angka lewat pseudo-element: aria-label sudah memuat skor, dan teks "1000" tidak ganda dengan angka skor.
        <div className="relative mt-2 h-4 text-xs text-muted">
          {BOUNDARIES.map((value) => (
            <span
              key={value}
              data-value={value}
              className="absolute after:content-[attr(data-value)]"
              style={{ left: `${value / 10}%`, transform: `translateX(-${value / 10}%)` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
