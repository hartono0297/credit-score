import { buildScoreInput, extractFromProfile, LOW_CONFIDENCE_THRESHOLD } from "../lib/extraction";
import { formatRupiah } from "../lib/format";
import { createSeedState, demoProfiles } from "../lib/seed";
import { BASE_SCORE, scoreApplication } from "../lib/scoring";
import type { Factor, Grade, Status } from "../lib/types";

type Expectation = {
  profileId: string;
  score: number;
  grade: Grade;
  status: Status;
  guardrails: string[];
};

const EXPECTATIONS: Expectation[] = [
  { profileId: "C-01", score: 1000, grade: "A", status: "Approved", guardrails: [] },
  { profileId: "C-02", score: 745, grade: "B", status: "Scored", guardrails: [] },
  { profileId: "C-03", score: 615, grade: "C", status: "Scored", guardrails: [] },
  { profileId: "C-04", score: 525, grade: "D", status: "Scored", guardrails: [] },
  {
    profileId: "C-05",
    score: 215,
    grade: "E",
    status: "Manual Review",
    guardrails: ["GR-01", "GR-02"],
  },
];

const DIRECTION_ORDER: Record<Factor["direction"], number> = {
  positive: 0,
  neutral: 1,
  negative: 2,
};

const failures: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

function isSortedByWeight(factors: Factor[]): boolean {
  for (let index = 1; index < factors.length; index += 1) {
    const previous = factors[index - 1];
    const current = factors[index];
    const previousWeight = Math.abs(previous.points);
    const currentWeight = Math.abs(current.points);

    if (previousWeight < currentWeight) return false;
    if (
      previousWeight === currentWeight &&
      DIRECTION_ORDER[previous.direction] > DIRECTION_ORDER[current.direction]
    ) {
      return false;
    }
  }
  return true;
}

const seed = createSeedState();

console.log("Verifikasi skor profil demo (PRD 11.1)\n");
console.log(
  "Profil".padEnd(8) +
    "Plafon / tenor".padEnd(28) +
    "Skor".padEnd(6) +
    "Grade".padEnd(7) +
    "Status".padEnd(17) +
    "Guardrail",
);

for (const application of seed.applications) {
  const profile = demoProfiles.find((item) => item.id === application.profileId);
  const expectation = EXPECTATIONS.find((item) => item.profileId === application.profileId);

  if (!profile || !expectation) {
    failures.push(`${application.id}: profil atau ekspektasi tidak ditemukan`);
    continue;
  }

  const input = buildScoreInput(
    profile,
    { plafon: application.plafon, tenor: application.tenor },
    application.extraction,
  );
  const result = scoreApplication(input);

  const rawScore = BASE_SCORE + result.allFactors.reduce((sum, factor) => sum + factor.points, 0);
  const clampedScore = Math.min(Math.max(rawScore, 0), 1000);

  check(
    result.score === expectation.score,
    `${profile.id}: skor ${result.score}, seharusnya ${expectation.score}`,
  );
  check(
    result.grade === expectation.grade,
    `${profile.id}: grade ${result.grade}, seharusnya ${expectation.grade}`,
  );
  check(
    application.status === expectation.status,
    `${profile.id}: status ${application.status}, seharusnya ${expectation.status}`,
  );
  check(
    clampedScore === result.score,
    `${profile.id}: 520 + total poin (${rawScore}) tidak konsisten dengan skor ${result.score}`,
  );
  check(result.factors.length === 5, `${profile.id}: faktor teratas harus 5, bukan ${result.factors.length}`);
  check(result.allFactors.length === 6, `${profile.id}: total faktor harus 6`);
  check(isSortedByWeight(result.factors), `${profile.id}: faktor tidak urut |poin| lalu positif lebih dulu`);
  check(
    expectation.guardrails.length === result.guardrails.length &&
      expectation.guardrails.every((id) => result.guardrails.some((item) => item.id === id)),
    `${profile.id}: guardrail ${result.guardrails.map((item) => item.id).join(", ") || "kosong"} tidak sesuai`,
  );

  check(application.score?.score === result.score, `${profile.id}: skor di seed tidak sama dengan hasil hitung`);
  check(application.score?.grade === result.grade, `${profile.id}: grade di seed tidak sama dengan hasil hitung`);

  const storedExtraction = application.extraction;
  const generatedExtraction = extractFromProfile(profile);
  check(
    JSON.stringify(storedExtraction) === JSON.stringify(generatedExtraction),
    `${profile.id}: ekstraksi seed tidak deterministik`,
  );

  if (storedExtraction) {
    const fields = [
      storedExtraction.ktp.nama,
      storedExtraction.ktp.nik,
      storedExtraction.ktp.tanggalLahir,
      storedExtraction.slipGaji.employer,
      storedExtraction.slipGaji.thp,
      storedExtraction.slipGaji.masaKerjaBulan,
      storedExtraction.mutasi.rataRataSaldo,
      storedExtraction.mutasi.inflowBulanan,
      storedExtraction.mutasi.cicilanTerdeteksi,
    ];
    check(
      fields.some((field) => field.confidence < LOW_CONFIDENCE_THRESHOLD),
      `${profile.id}: tidak ada field dengan confidence di bawah 0,80`,
    );
  } else {
    failures.push(`${profile.id}: ekstraksi seed tidak ada`);
  }

  check(
    profile.worstKolektibilitas === Math.max(...profile.slik.map((facility) => facility.kolektibilitas)),
    `${profile.id}: worstKolektibilitas tidak sama dengan kolektibilitas terburuk SLIK`,
  );
  check(
    JSON.stringify(scoreApplication(input)) === JSON.stringify(result),
    `${profile.id}: scoring tidak deterministik`,
  );
  check(
    result.narrative.includes(`Skor ${result.score}`) && result.narrative.includes(`Grade ${result.grade}`),
    `${profile.id}: narasi tidak menyebut skor dan grade`,
  );

  const label = `${formatRupiah(application.plafon)} / ${application.tenor} bln`;
  const guardrailLabel = result.guardrails.map((item) => item.id).join(", ") || "-";

  console.log(
    profile.id.padEnd(8) +
      label.padEnd(28) +
      String(result.score).padEnd(6) +
      result.grade.padEnd(7) +
      application.status.padEnd(17) +
      guardrailLabel,
  );
}

const approvedLog = seed.applications.find((application) => application.id === "APP-001");
const manualReview = seed.applications.find((application) => application.id === "APP-005");

check(seed.version === 2, `StoreState harus version 2`);
check(seed.nextId === 6, `nextId harus 6, bukan ${seed.nextId}`);
check(approvedLog?.log.length === 1, `APP-001 harus punya satu log seed`);
check(approvedLog?.log[0]?.decision === "Approved", `APP-001 log harus Approved`);
check(manualReview?.log.length === 0, `APP-005 tidak boleh punya log keputusan`);
check(
  manualReview?.score?.guardrails.length === 2,
  `APP-005 harus memicu GR-01 dan GR-02`,
);

console.log("\nCatatan: C-01 menghasilkan skor mentah 1000, tepat di batas atas clamp 0..1000.");

if (failures.length > 0) {
  console.error(`\nGAGAL: ${failures.length} pemeriksaan tidak lulus.`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("OK: 5 profil menghasilkan skor dan grade sesuai tabel, C-05 memicu GR-01 dan GR-02.");
}
