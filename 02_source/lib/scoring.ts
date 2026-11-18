import { formatDecimal, formatPercent } from "./format";
import type { Factor, Grade, ScoreInput, ScoreResult } from "./types";

export const BASE_SCORE = 520;

const DIRECTION_ORDER: Record<Factor["direction"], number> = {
  positive: 0,
  neutral: 1,
  negative: 2,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function directionOf(points: number): Factor["direction"] {
  if (points > 0) return "positive";
  if (points < 0) return "negative";
  return "neutral";
}

function pointsForDti(dti: number): number {
  if (dti <= 0.2) return 120;
  if (dti <= 0.35) return 60;
  if (dti <= 0.5) return 0;
  return -120;
}

function pointsForExistingRatio(ratio: number): number {
  if (ratio <= 0.1) return 60;
  if (ratio <= 0.25) return 20;
  if (ratio <= 0.4) return -40;
  return -90;
}

function pointsForIncomeCv(cv: number): number {
  if (cv <= 0.1) return 80;
  if (cv <= 0.25) return 30;
  if (cv <= 0.4) return -40;
  return -90;
}

function pointsForSalaryGap(gap: number): number {
  if (gap <= 0.1) return 60;
  if (gap <= 0.25) return 15;
  if (gap <= 0.5) return -45;
  return -100;
}

function pointsForKolektibilitas(kolektibilitas: number): number {
  if (kolektibilitas === 1) return 100;
  if (kolektibilitas === 2) return 0;
  return -200;
}

function pointsForLate(lateCount: number, has90Plus: boolean): number {
  if (has90Plus) return -150;
  if (lateCount === 0) return 60;
  if (lateCount <= 2) return 0;
  if (lateCount <= 5) return -60;
  return -130;
}

function gradeFor(score: number): { grade: Grade; recommendation: string } {
  if (score >= 800) return { grade: "A", recommendation: "Approve, plafon sesuai pengajuan" };
  if (score >= 700) return { grade: "B", recommendation: "Approve, plafon maks 80% pengajuan" };
  if (score >= 600) return { grade: "C", recommendation: "Manual review, plafon maks 50% pengajuan" };
  if (score >= 500) return { grade: "D", recommendation: "Manual review atau approve bersyarat" };
  return { grade: "E", recommendation: "Rekomendasi reject" };
}

function compareByWeight(a: Factor, b: Factor): number {
  const weight = Math.abs(b.points) - Math.abs(a.points);
  if (weight !== 0) return weight;
  return DIRECTION_ORDER[a.direction] - DIRECTION_ORDER[b.direction];
}

const KOLEKTIBILITAS_LABELS: Record<number, string> = {
  1: "lancar",
  2: "dalam perhatian khusus",
  3: "kurang lancar",
  4: "diragukan",
  5: "macet",
};

function upperFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function lateDetail(lateCount: number, has90Plus: boolean): string {
  if (has90Plus) return "ada tunggakan 90+ hari dalam 12 bulan";
  if (lateCount === 0) return "tidak pernah telat dalam 12 bulan";
  return `telat ${lateCount} kali dalam 12 bulan`;
}

function factor(key: string, label: string, points: number, detail: string): Factor {
  return { key, label, points, direction: directionOf(points), detail };
}

export function scoreApplication(input: ScoreInput): ScoreResult {
  const newInstallment = (input.plafon * (1 + 0.02 * input.tenor)) / input.tenor;
  const dti = (newInstallment + input.existingInstallment) / input.thp;
  const existingRatio = input.existingInstallment / input.thp;

  const allFactors: Factor[] = [
    factor("dti", "Rasio DTI", pointsForDti(dti), `DTI ${formatPercent(dti)} dari THP`),
    factor(
      "existing",
      "Rasio cicilan existing",
      pointsForExistingRatio(existingRatio),
      `cicilan existing ${formatPercent(existingRatio)} dari THP`,
    ),
    factor(
      "income-cv",
      "Stabilitas income",
      pointsForIncomeCv(input.incomeCv),
      `koefisien variasi inflow ${formatDecimal(input.incomeCv)}`,
    ),
    factor(
      "salary-gap",
      "Selisih slip-mutasi",
      pointsForSalaryGap(input.salaryGap),
      `selisih slip-mutasi ${formatPercent(input.salaryGap)}`,
    ),
    factor(
      "kolektibilitas",
      "Kolektibilitas SLIK",
      pointsForKolektibilitas(input.worstKolektibilitas),
      `kolektibilitas terburuk ${input.worstKolektibilitas} (${KOLEKTIBILITAS_LABELS[input.worstKolektibilitas]})`,
    ),
    factor(
      "late",
      "Keterlambatan 12 bulan",
      pointsForLate(input.lateCount, input.has90Plus),
      lateDetail(input.lateCount, input.has90Plus),
    ),
  ];

  const rawScore = BASE_SCORE + allFactors.reduce((sum, factor) => sum + factor.points, 0);
  const score = clamp(rawScore, 0, 1000);
  const { grade, recommendation } = gradeFor(score);
  const factors = [...allFactors].sort(compareByWeight).slice(0, 5);

  const guardrails: ScoreResult["guardrails"] = [];
  if (input.worstKolektibilitas >= 3) {
    guardrails.push({
      id: "GR-01",
      label: `kolektibilitas ${input.worstKolektibilitas} (ambang 3)`,
    });
  }
  if (dti > 0.5) {
    guardrails.push({ id: "GR-02", label: `DTI ${formatPercent(dti)} di atas 50%` });
  }
  if (input.has90Plus) {
    guardrails.push({ id: "GR-03", label: "tunggakan 90+ hari dalam 12 bulan" });
  }

  const topPositive = allFactors
    .filter((factor) => factor.points > 0)
    .sort((a, b) => b.points - a.points)[0];
  const topNegative = allFactors
    .filter((factor) => factor.points < 0)
    .sort((a, b) => a.points - b.points)[0];

  const sentences = [`Skor ${score} (Grade ${grade}).`];
  if (topPositive && topNegative) {
    sentences.push(
      `${upperFirst(topPositive.detail)} menaikkan skor (+${topPositive.points}), namun ${topNegative.detail} menurunkan skor (${topNegative.points}).`,
    );
  } else if (topPositive) {
    sentences.push(`${upperFirst(topPositive.detail)} menaikkan skor (+${topPositive.points}).`);
  } else if (topNegative) {
    sentences.push(`${upperFirst(topNegative.detail)} menurunkan skor (${topNegative.points}).`);
  }
  sentences.push(
    recommendation.startsWith("Rekomendasi")
      ? `${recommendation}.`
      : `Rekomendasi: ${recommendation}.`,
  );

  return {
    score,
    grade,
    dti,
    newInstallment,
    recommendation,
    factors,
    allFactors,
    guardrails,
    narrative: sentences.join(" "),
  };
}
