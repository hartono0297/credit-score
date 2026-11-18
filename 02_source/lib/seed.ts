import { buildScoreInput, extractFromProfile } from "./extraction";
import { scoreApplication } from "./scoring";
import type { Application, Profile, StoreState } from "./types";

export const demoProfiles: Profile[] = [
  {
    id: "C-01",
    name: "Andi Pratama",
    nik: "3273xxxxxxxx0001",
    birthDate: "1989-04-12",
    employer: "PT Nusantara Ritel",
    thp: 12_000_000,
    tenureMonths: 72,
    incomeCv: 0.05,
    salaryGap: 0.05,
    existingInstallment: 0,
    avgBalance: 8_500_000,
    monthlyInflow: 12_600_000,
    slik: [
      {
        lender: "Bank Nusantara",
        jenis: "Kartu kredit",
        plafon: 15_000_000,
        bakiDebet: 0,
        kolektibilitas: 1,
      },
    ],
    worstKolektibilitas: 1,
    lateCount: 0,
    has90Plus: false,
  },
  {
    id: "C-02",
    name: "Budi Santoso",
    nik: "3273xxxxxxxx0002",
    birthDate: "1985-09-03",
    employer: "PT Mitra Logistik",
    thp: 15_000_000,
    tenureMonths: 48,
    incomeCv: 0.18,
    salaryGap: 0.12,
    existingInstallment: 3_400_000,
    avgBalance: 6_200_000,
    monthlyInflow: 16_800_000,
    slik: [
      {
        lender: "Bank Nusantara",
        jenis: "Kredit multiguna",
        plafon: 50_000_000,
        bakiDebet: 22_000_000,
        kolektibilitas: 1,
      },
      {
        lender: "Mitra Finance",
        jenis: "Pembiayaan motor",
        plafon: 18_000_000,
        bakiDebet: 6_000_000,
        kolektibilitas: 1,
      },
    ],
    worstKolektibilitas: 1,
    lateCount: 0,
    has90Plus: false,
  },
  {
    id: "C-03",
    name: "Rina Kurniawati",
    nik: "3273xxxxxxxx0003",
    birthDate: "1994-03-12",
    employer: "PT Sinar Digital",
    thp: 10_000_000,
    tenureMonths: 26,
    incomeCv: 0.33,
    salaryGap: 0.28,
    existingInstallment: 1_500_000,
    avgBalance: 4_200_000,
    monthlyInflow: 12_800_000,
    slik: [
      {
        lender: "Bank Nusantara",
        jenis: "Kartu kredit",
        plafon: 25_000_000,
        bakiDebet: 9_500_000,
        kolektibilitas: 1,
      },
    ],
    worstKolektibilitas: 1,
    lateCount: 1,
    has90Plus: false,
  },
  {
    id: "C-04",
    name: "Dewi Lestari",
    nik: "3273xxxxxxxx0004",
    birthDate: "1991-11-27",
    employer: "CV Karya Baja",
    thp: 9_000_000,
    tenureMonths: 30,
    incomeCv: 0.22,
    salaryGap: 0.2,
    existingInstallment: 2_400_000,
    avgBalance: 2_800_000,
    monthlyInflow: 10_800_000,
    slik: [
      {
        lender: "Bank Nusantara",
        jenis: "Kredit multiguna",
        plafon: 30_000_000,
        bakiDebet: 14_000_000,
        kolektibilitas: 2,
      },
      {
        lender: "Mitra Finance",
        jenis: "Pembiayaan motor",
        plafon: 15_000_000,
        bakiDebet: 5_000_000,
        kolektibilitas: 1,
      },
    ],
    worstKolektibilitas: 2,
    lateCount: 2,
    has90Plus: false,
  },
  {
    id: "C-05",
    name: "Joko Susilo",
    nik: "3273xxxxxxxx0005",
    birthDate: "1987-07-08",
    employer: "PT Anugerah Tekstil",
    thp: 8_000_000,
    tenureMonths: 18,
    incomeCv: 0.22,
    salaryGap: 0.18,
    existingInstallment: 3_400_000,
    avgBalance: 1_500_000,
    monthlyInflow: 9_440_000,
    slik: [
      {
        lender: "Bank Nusantara",
        jenis: "Kredit multiguna",
        plafon: 40_000_000,
        bakiDebet: 34_000_000,
        kolektibilitas: 3,
      },
    ],
    worstKolektibilitas: 3,
    lateCount: 0,
    has90Plus: false,
  },
];

type SeedConfig = {
  id: string;
  profile: Profile;
  status: Application["status"];
  plafon: number;
  tenor: number;
  dp: number;
  purpose: string;
  log?: Application["log"];
};

const seedConfigs: SeedConfig[] = [
  {
    id: "APP-001",
    profile: demoProfiles[0],
    status: "Approved",
    plafon: 20_000_000,
    tenor: 12,
    dp: 2_000_000,
    purpose: "Pembelian elektronik rumah tangga",
    log: [
      {
        timestamp: "2026-11-16T08:00:00.000Z",
        applicationId: "APP-001",
        decision: "Approved",
        reasonCode: "OTHER",
        notes: "SLIK lancar dan DTI di bawah 20%. Disetujui sesuai pengajuan.",
        activeGuardrails: [],
      },
    ],
  },
  {
    id: "APP-002",
    profile: demoProfiles[1],
    status: "Scored",
    plafon: 30_000_000,
    tenor: 18,
    dp: 3_000_000,
    purpose: "Renovasi dapur",
  },
  {
    id: "APP-003",
    profile: demoProfiles[2],
    status: "Scored",
    plafon: 15_000_000,
    tenor: 12,
    dp: 1_500_000,
    purpose: "Renovasi rumah",
  },
  {
    id: "APP-004",
    profile: demoProfiles[3],
    status: "Scored",
    plafon: 18_000_000,
    tenor: 18,
    dp: 1_800_000,
    purpose: "Pembelian perabot kantor",
  },
  {
    id: "APP-005",
    profile: demoProfiles[4],
    status: "Manual Review",
    plafon: 12_000_000,
    tenor: 12,
    dp: 1_200_000,
    purpose: "Pembelian mesin jahit",
  },
];

function createSeedApplication(config: SeedConfig): Application {
  const extraction = extractFromProfile(config.profile);
  const score = scoreApplication(
    buildScoreInput(
      config.profile,
      { plafon: config.plafon, tenor: config.tenor },
      extraction,
    ),
  );

  return {
    id: config.id,
    profileId: config.profile.id,
    customerName: config.profile.name,
    product: "BNPL",
    plafon: config.plafon,
    tenor: config.tenor,
    dp: config.dp,
    purpose: config.purpose,
    status: config.status,
    documents: [
      { type: "KTP", fileName: `ktp-${config.profile.id.toLowerCase()}.jpg` },
      { type: "SLIP_GAJI", fileName: `slip-${config.profile.id.toLowerCase()}.pdf` },
      { type: "MUTASI", fileName: `mutasi-${config.profile.id.toLowerCase()}.pdf` },
    ],
    extraction,
    score,
    log: config.log ?? [],
  };
}

export function createSeedState(): StoreState {
  return {
    version: 2,
    nextId: 6,
    applications: seedConfigs.map(createSeedApplication),
  };
}
