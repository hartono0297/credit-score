import assert from "node:assert/strict";
import test from "node:test";
import {
  LOW_CONFIDENCE_THRESHOLD,
  buildScoreInput,
  effectiveValues,
  extractFromProfile,
} from "../../../02_source/lib/extraction";
import { formatAmountInput, parseAmount } from "../../../02_source/lib/format";
import { demoProfiles } from "../../../02_source/lib/seed";
import type { ExtractedField, Extraction, Profile } from "../../../02_source/lib/types";

type FieldCase = {
  name: string;
  read: (extraction: Extraction) => ExtractedField<string | number>;
  profileValue: (profile: Profile) => string | number;
  confidence: number;
};

const FIELD_CASES: FieldCase[] = [
  {
    name: "ktp.nama",
    read: (extraction) => extraction.ktp.nama,
    profileValue: (profile) => profile.name,
    confidence: 0.96,
  },
  {
    name: "ktp.nik",
    read: (extraction) => extraction.ktp.nik,
    profileValue: (profile) => profile.nik,
    confidence: 0.93,
  },
  {
    name: "ktp.tanggalLahir",
    read: (extraction) => extraction.ktp.tanggalLahir,
    profileValue: (profile) => profile.birthDate,
    confidence: 0.95,
  },
  {
    name: "slipGaji.employer",
    read: (extraction) => extraction.slipGaji.employer,
    profileValue: (profile) => profile.employer,
    confidence: 0.9,
  },
  {
    name: "slipGaji.thp",
    read: (extraction) => extraction.slipGaji.thp,
    profileValue: (profile) => profile.thp,
    confidence: 0.88,
  },
  {
    name: "slipGaji.masaKerjaBulan",
    read: (extraction) => extraction.slipGaji.masaKerjaBulan,
    profileValue: (profile) => profile.tenureMonths,
    confidence: 0.86,
  },
  {
    name: "mutasi.rataRataSaldo",
    read: (extraction) => extraction.mutasi.rataRataSaldo,
    profileValue: (profile) => profile.avgBalance,
    confidence: 0.84,
  },
  {
    name: "mutasi.inflowBulanan",
    read: (extraction) => extraction.mutasi.inflowBulanan,
    profileValue: (profile) => profile.monthlyInflow,
    confidence: 0.82,
  },
  {
    name: "mutasi.cicilanTerdeteksi",
    read: (extraction) => extraction.mutasi.cicilanTerdeteksi,
    profileValue: (profile) => profile.existingInstallment,
    confidence: 0.78,
  },
];

function assertClose(actual: number, expected: number, message?: string): void {
  assert.ok(
    Math.abs(actual - expected) < 1e-12,
    message ?? `nilai ${actual} tidak mendekati ${expected}`,
  );
}

test("confidence statis untuk semua profil dan field 0,78 selalu rendah", () => {
  assert.equal(LOW_CONFIDENCE_THRESHOLD, 0.8);

  for (const profile of demoProfiles) {
    const extraction = extractFromProfile(profile);
    const fields = FIELD_CASES.map((field) => field.read(extraction));

    for (const fieldCase of FIELD_CASES) {
      const field = fieldCase.read(extraction);
      assert.equal(field.confidence, fieldCase.confidence, `${profile.id} ${fieldCase.name}`);
    }

    assert.equal(
      extraction.mutasi.cicilanTerdeteksi.confidence,
      0.78,
      `${profile.id} confidence cicilan terdeteksi`,
    );
    assert.equal(
      fields.filter((field) => field.confidence < LOW_CONFIDENCE_THRESHOLD).length,
      1,
      `${profile.id} jumlah field perlu verifikasi`,
    );
  }
});

test("nilai ekstraksi diambil dari profil demo", () => {
  for (const profile of demoProfiles) {
    const extraction = extractFromProfile(profile);

    for (const fieldCase of FIELD_CASES) {
      assert.equal(
        fieldCase.read(extraction).value,
        fieldCase.profileValue(profile),
        `${profile.id} ${fieldCase.name}`,
      );
      assert.equal(fieldCase.read(extraction).edited, undefined, `${profile.id} edited`);
    }
  }
});

test("effectiveValues memakai profil bila ekstraksi tidak tersedia", () => {
  for (const profile of demoProfiles) {
    const effective = effectiveValues(profile);

    assert.equal(effective.thp, profile.thp, `${profile.id} thp`);
    assert.equal(
      effective.existingInstallment,
      profile.existingInstallment,
      `${profile.id} cicilan`,
    );
    assert.equal(effective.monthlyInflow, profile.monthlyInflow, `${profile.id} inflow`);
    assertClose(
      effective.salaryGap,
      Math.abs(profile.thp - profile.monthlyInflow) / profile.thp,
      `${profile.id} salary gap`,
    );
  }
});

test("effectiveValues memakai koreksi analyst dan menghitung gap dari nilai efektif", () => {
  const profile = demoProfiles[2];
  const extraction = extractFromProfile(profile);
  extraction.slipGaji.thp = { value: 12_000_000, confidence: 0.88, edited: true };
  extraction.mutasi.cicilanTerdeteksi = {
    value: 2_000_000,
    confidence: 0.78,
    edited: true,
  };
  extraction.mutasi.inflowBulanan = { value: 13_000_000, confidence: 0.82, edited: true };

  const effective = effectiveValues(profile, extraction);

  assert.equal(effective.thp, 12_000_000);
  assert.equal(effective.existingInstallment, 2_000_000);
  assert.equal(effective.monthlyInflow, 13_000_000);
  assertClose(effective.salaryGap, Math.abs(12_000_000 - 13_000_000) / 12_000_000);
});

test("koreksi inflow mengubah gap sementara field lain tetap dari profil", () => {
  const profile = demoProfiles[2];
  const extraction = extractFromProfile(profile);
  extraction.mutasi.inflowBulanan = { value: 10_000_000, confidence: 0.82, edited: true };

  const effective = effectiveValues(profile, extraction);

  assert.equal(effective.thp, profile.thp);
  assert.equal(effective.existingInstallment, profile.existingInstallment);
  assert.equal(effective.monthlyInflow, 10_000_000);
  assertClose(effective.salaryGap, 0);
});

test("buildScoreInput memakai nilai efektif dan atribut profil", () => {
  const profile = demoProfiles[2];
  const extraction = extractFromProfile(profile);
  extraction.slipGaji.thp = { value: 12_000_000, confidence: 0.88, edited: true };
  extraction.mutasi.cicilanTerdeteksi = {
    value: 2_000_000,
    confidence: 0.78,
    edited: true,
  };
  extraction.mutasi.inflowBulanan = { value: 13_000_000, confidence: 0.82, edited: true };

  const input = buildScoreInput(profile, { plafon: 15_000_000, tenor: 12 }, extraction);

  assert.equal(input.plafon, 15_000_000);
  assert.equal(input.tenor, 12);
  assert.equal(input.thp, 12_000_000);
  assert.equal(input.existingInstallment, 2_000_000);
  assert.equal(input.incomeCv, profile.incomeCv);
  assert.equal(input.worstKolektibilitas, profile.worstKolektibilitas);
  assert.equal(input.lateCount, profile.lateCount);
  assert.equal(input.has90Plus, profile.has90Plus);
  assertClose(input.salaryGap, Math.abs(12_000_000 - 13_000_000) / 12_000_000);
});

test("buildScoreInput tanpa ekstraksi memakai nilai profil", () => {
  const profile = demoProfiles[1];
  const input = buildScoreInput(profile, { plafon: 30_000_000, tenor: 18 });

  assert.equal(input.thp, profile.thp);
  assert.equal(input.existingInstallment, profile.existingInstallment);
  assertClose(
    input.salaryGap,
    Math.abs(profile.thp - profile.monthlyInflow) / profile.thp,
  );
});

test("input nominal Rupiah diformat dan diparse kembali", () => {
  assert.equal(formatAmountInput("2000000"), "2.000.000");
  assert.equal(formatAmountInput("Rp 2.000.000"), "2.000.000");
  assert.equal(formatAmountInput("0050000"), "50.000");
  assert.equal(formatAmountInput("abc"), "");
  assert.equal(parseAmount("2.000.000"), 2_000_000);
  assert.equal(parseAmount("Rp 15.000.000"), 15_000_000);
  assert.ok(Number.isNaN(parseAmount("")));
});
