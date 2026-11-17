import type { Extraction, Profile, ScoreInput } from "./types";

export const LOW_CONFIDENCE_THRESHOLD = 0.8;

export function extractFromProfile(profile: Profile): Extraction {
  return {
    ktp: {
      nama: { value: profile.name, confidence: 0.96 },
      nik: { value: profile.nik, confidence: 0.93 },
      tanggalLahir: { value: profile.birthDate, confidence: 0.95 },
    },
    slipGaji: {
      employer: { value: profile.employer, confidence: 0.9 },
      thp: { value: profile.thp, confidence: 0.88 },
      masaKerjaBulan: { value: profile.tenureMonths, confidence: 0.86 },
    },
    mutasi: {
      rataRataSaldo: { value: profile.avgBalance, confidence: 0.84 },
      inflowBulanan: { value: profile.monthlyInflow, confidence: 0.82 },
      cicilanTerdeteksi: { value: profile.existingInstallment, confidence: 0.78 },
    },
  };
}

export type EffectiveValues = {
  thp: number;
  existingInstallment: number;
  monthlyInflow: number;
  salaryGap: number;
};

// Gap dihitung dari nilai efektif agar koreksi analyst ikut memengaruhi skor.
export function effectiveValues(profile: Profile, extraction?: Extraction): EffectiveValues {
  const thp = extraction?.slipGaji.thp.value ?? profile.thp;
  const existingInstallment =
    extraction?.mutasi.cicilanTerdeteksi.value ?? profile.existingInstallment;
  const monthlyInflow = extraction?.mutasi.inflowBulanan.value ?? profile.monthlyInflow;

  return {
    thp,
    existingInstallment,
    monthlyInflow,
    salaryGap: Math.abs(thp - monthlyInflow) / thp,
  };
}

export function buildScoreInput(
  profile: Profile,
  request: { plafon: number; tenor: number },
  extraction?: Extraction,
): ScoreInput {
  const effective = effectiveValues(profile, extraction);

  return {
    plafon: request.plafon,
    tenor: request.tenor,
    thp: effective.thp,
    existingInstallment: effective.existingInstallment,
    incomeCv: profile.incomeCv,
    salaryGap: effective.salaryGap,
    worstKolektibilitas: profile.worstKolektibilitas,
    lateCount: profile.lateCount,
    has90Plus: profile.has90Plus,
  };
}
