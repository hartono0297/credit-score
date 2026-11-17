import assert from "node:assert/strict";
import test from "node:test";
import { buildScoreInput } from "../../../02_source/lib/extraction";
import { createSeedState, demoProfiles } from "../../../02_source/lib/seed";
import { BASE_SCORE, scoreApplication } from "../../../02_source/lib/scoring";
import type { Factor, Grade, ScoreInput, ScoreResult } from "../../../02_source/lib/types";

const EXPECTED_SEED_SCORES: Record<string, { score: number; grade: Grade }> = {
  "C-01": { score: 1000, grade: "A" },
  "C-02": { score: 745, grade: "B" },
  "C-03": { score: 615, grade: "C" },
  "C-04": { score: 525, grade: "D" },
  "C-05": { score: 215, grade: "E" },
};

const BASE_INPUT: ScoreInput = {
  plafon: 5_000_000,
  tenor: 24,
  thp: 10_000_000,
  existingInstallment: 0,
  incomeCv: 0.05,
  salaryGap: 0.05,
  worstKolektibilitas: 1,
  lateCount: 0,
  has90Plus: false,
};

const DIRECTION_ORDER: Record<Factor["direction"], number> = {
  positive: 0,
  neutral: 1,
  negative: 2,
};

function totalPoints(result: ScoreResult): number {
  return result.allFactors.reduce((sum, factor) => sum + factor.points, 0);
}

function pointsOf(result: ScoreResult, key: string): number {
  const match = result.allFactors.find((factor) => factor.key === key);
  assert.ok(match, `faktor ${key} tidak ditemukan`);
  return match.points;
}

function pointsFor(overrides: Partial<ScoreInput>, key: string): number {
  return pointsOf(scoreApplication({ ...BASE_INPUT, ...overrides }), key);
}

function expectedOrder(factors: Factor[]): string[] {
  return [...factors]
    .sort(
      (left, right) =>
        Math.abs(right.points) - Math.abs(left.points) ||
        DIRECTION_ORDER[left.direction] - DIRECTION_ORDER[right.direction],
    )
    .map((factor) => factor.key);
}

function scoreForProfileId(profileId: string): ScoreResult {
  const application = createSeedState().applications.find(
    (item) => item.profileId === profileId,
  );
  assert.ok(application, `aplikasi seed ${profileId} tidak ditemukan`);
  const profile = demoProfiles.find((item) => item.id === profileId);
  assert.ok(profile, `profil ${profileId} tidak ditemukan`);

  return scoreApplication(
    buildScoreInput(
      profile,
      { plafon: application.plafon, tenor: application.tenor },
      application.extraction,
    ),
  );
}

test("lima aplikasi seed menghasilkan skor dan grade wajib", () => {
  for (const application of createSeedState().applications) {
    const expected = EXPECTED_SEED_SCORES[application.profileId];
    assert.ok(expected, `ekspektasi ${application.profileId} tidak ada`);

    const result = scoreForProfileId(application.profileId);

    assert.equal(result.score, expected.score, `${application.id} skor`);
    assert.equal(result.grade, expected.grade, `${application.id} grade`);
    assert.equal(application.score?.score, expected.score, `${application.id} skor tersimpan`);
    assert.equal(application.score?.grade, expected.grade, `${application.id} grade tersimpan`);
  }
});

test("skor selalu berada di rentang 0 sampai 1000", () => {
  const worstInput: ScoreInput = {
    plafon: 50_000_000,
    tenor: 3,
    thp: 1,
    existingInstallment: 50_000_000,
    incomeCv: 1,
    salaryGap: 1,
    worstKolektibilitas: 5,
    lateCount: 12,
    has90Plus: true,
  };
  const worst = scoreApplication(worstInput);
  const worstRaw = BASE_SCORE + totalPoints(worst);

  assert.ok(worstRaw < 0, `skor mentah kasus terburuk seharusnya negatif, bukan ${worstRaw}`);
  assert.equal(worst.score, 0);
  assert.equal(worst.grade, "E");

  const bestInput: ScoreInput = {
    plafon: 5_000_000,
    tenor: 24,
    thp: 1_000_000_000,
    existingInstallment: 0,
    incomeCv: 0,
    salaryGap: 0,
    worstKolektibilitas: 1,
    lateCount: 0,
    has90Plus: false,
  };
  const best = scoreApplication(bestInput);

  assert.equal(BASE_SCORE + totalPoints(best), 1000, "skor mentah kasus terbaik");
  assert.equal(best.score, 1000);
  assert.equal(best.grade, "A");

  for (const profileId of Object.keys(EXPECTED_SEED_SCORES)) {
    const score = scoreForProfileId(profileId).score;
    assert.ok(score >= 0 && score <= 1000, `${profileId} keluar rentang: ${score}`);
  }
});

test("faktor top 5 urut nilai absolut dan total kontribusi konsisten dengan skor", () => {
  for (const application of createSeedState().applications) {
    const result = scoreForProfileId(application.profileId);
    const raw = BASE_SCORE + totalPoints(result);

    assert.equal(result.score, Math.min(Math.max(raw, 0), 1000), `${application.id} skor`);
    assert.equal(result.factors.length, 5, `${application.id} jumlah faktor top 5`);
    assert.equal(result.allFactors.length, 6, `${application.id} jumlah seluruh faktor`);
    assert.deepEqual(
      result.factors.map((factor) => factor.key),
      expectedOrder(result.allFactors).slice(0, 5),
      `${application.id} urutan faktor top 5`,
    );

    for (let index = 1; index < result.factors.length; index += 1) {
      const previous = result.factors[index - 1];
      const current = result.factors[index];
      assert.ok(
        Math.abs(previous.points) >= Math.abs(current.points),
        `${application.id} faktor ${previous.key} lebih ringan dari ${current.key}`,
      );
    }
  }
});

test("scoring deterministik pada pemanggilan berulang", () => {
  const input = buildScoreInput(
    demoProfiles[2],
    { plafon: 15_000_000, tenor: 12 },
    undefined,
  );
  const first = scoreApplication(input);
  const second = scoreApplication(input);

  assert.deepEqual(second, first);
});

test("guardrail C-05 aktif dan GR-03 dievaluasi di scoring", () => {
  const result = scoreForProfileId("C-05");

  assert.deepEqual(
    result.guardrails.map((guardrail) => guardrail.id),
    ["GR-01", "GR-02"],
  );
  assert.match(result.guardrails[0].label, /^kolektibilitas 3 \(ambang 3\)$/);
  assert.match(result.guardrails[1].label, /^DTI 58,0% di atas 50%$/);
  assert.equal(result.grade, "E");

  const withNinetyPlus = scoreApplication({ ...BASE_INPUT, has90Plus: true });
  assert.deepEqual(
    withNinetyPlus.guardrails.map((guardrail) => guardrail.id),
    ["GR-03"],
  );

  assert.deepEqual(scoreApplication(BASE_INPUT).guardrails, []);
});

test("ambang poin DTI sesuai PRD 12.2", () => {
  const dtiPoints = (existingInstallment: number) =>
    pointsFor({ plafon: 12_000_000, tenor: 12, existingInstallment }, "dti");

  assert.equal(dtiPoints(760_000), 120);
  assert.equal(dtiPoints(1_260_000), 60);
  assert.equal(dtiPoints(2_260_000), 60);
  assert.equal(dtiPoints(3_760_000), 0);
  assert.equal(dtiPoints(3_860_000), -120);
});

test("ambang poin rasio cicilan existing sesuai PRD 12.2", () => {
  const ratioPoints = (existingInstallment: number) =>
    pointsFor({ existingInstallment }, "existing");

  assert.equal(ratioPoints(1_000_000), 60);
  assert.equal(ratioPoints(2_500_000), 20);
  assert.equal(ratioPoints(4_000_000), -40);
  assert.equal(ratioPoints(4_100_000), -90);
});

test("ambang poin stabilitas income sesuai PRD 12.2", () => {
  assert.equal(pointsFor({ incomeCv: 0.1 }, "income-cv"), 80);
  assert.equal(pointsFor({ incomeCv: 0.25 }, "income-cv"), 30);
  assert.equal(pointsFor({ incomeCv: 0.4 }, "income-cv"), -40);
  assert.equal(pointsFor({ incomeCv: 0.41 }, "income-cv"), -90);
});

test("ambang poin selisih slip-mutasi sesuai PRD 12.2", () => {
  assert.equal(pointsFor({ salaryGap: 0.1 }, "salary-gap"), 60);
  assert.equal(pointsFor({ salaryGap: 0.25 }, "salary-gap"), 15);
  assert.equal(pointsFor({ salaryGap: 0.5 }, "salary-gap"), -45);
  assert.equal(pointsFor({ salaryGap: 0.51 }, "salary-gap"), -100);
});

test("ambang poin kolektibilitas sesuai PRD 12.2", () => {
  assert.equal(pointsFor({ worstKolektibilitas: 1 }, "kolektibilitas"), 100);
  assert.equal(pointsFor({ worstKolektibilitas: 2 }, "kolektibilitas"), 0);
  assert.equal(pointsFor({ worstKolektibilitas: 3 }, "kolektibilitas"), -200);
  assert.equal(pointsFor({ worstKolektibilitas: 5 }, "kolektibilitas"), -200);
});

test("ambang poin keterlambatan sesuai PRD 12.2", () => {
  assert.equal(pointsFor({ lateCount: 0 }, "late"), 60);
  assert.equal(pointsFor({ lateCount: 1 }, "late"), 0);
  assert.equal(pointsFor({ lateCount: 2 }, "late"), 0);
  assert.equal(pointsFor({ lateCount: 3 }, "late"), -60);
  assert.equal(pointsFor({ lateCount: 5 }, "late"), -60);
  assert.equal(pointsFor({ lateCount: 6 }, "late"), -130);
  assert.equal(pointsFor({ lateCount: 0, has90Plus: true }, "late"), -150);
  assert.equal(pointsFor({ lateCount: 9, has90Plus: true }, "late"), -150);
});

test("scoreApplication 1000 panggilan selesai di bawah 1 detik", () => {
  const started = performance.now();
  for (let index = 0; index < 1000; index += 1) {
    scoreApplication(BASE_INPUT);
  }
  const elapsed = performance.now() - started;

  assert.ok(elapsed < 1000, `durasi ${elapsed.toFixed(1)} ms melewati target PT-01`);
});
