export type Status = "Draft" | "Scored" | "Manual Review" | "Approved" | "Rejected";

export type ReasonCode =
  | "INCOME_INSUFFICIENT"
  | "DTI_EXCEEDED"
  | "DELINQUENCY"
  | "THIN_FILE"
  | "DOC_MISMATCH"
  | "OTHER";

export type DocumentType = "KTP" | "SLIP_GAJI" | "MUTASI";

export type Grade = "A" | "B" | "C" | "D" | "E";

export type SlikFacility = {
  lender: string;
  jenis: string;
  plafon: number;
  bakiDebet: number;
  kolektibilitas: number;
};

export type Profile = {
  id: string;
  name: string;
  nik: string;
  birthDate: string;
  employer: string;
  thp: number;
  tenureMonths: number;
  incomeCv: number;
  salaryGap: number;
  existingInstallment: number;
  avgBalance: number;
  monthlyInflow: number;
  slik: SlikFacility[];
  worstKolektibilitas: number;
  lateCount: number;
  has90Plus: boolean;
};

export type ExtractedField<T> = { value: T; confidence: number; edited?: boolean };

export type Extraction = {
  ktp: {
    nama: ExtractedField<string>;
    nik: ExtractedField<string>;
    tanggalLahir: ExtractedField<string>;
  };
  slipGaji: {
    employer: ExtractedField<string>;
    thp: ExtractedField<number>;
    masaKerjaBulan: ExtractedField<number>;
  };
  mutasi: {
    rataRataSaldo: ExtractedField<number>;
    inflowBulanan: ExtractedField<number>;
    cicilanTerdeteksi: ExtractedField<number>;
  };
};

export type DecisionLog = {
  timestamp: string;
  applicationId: string;
  decision: "Approved" | "Rejected";
  reasonCode: ReasonCode;
  notes?: string;
  activeGuardrails: string[];
};

export type Application = {
  id: string;
  profileId: string;
  customerName: string;
  product: "BNPL";
  plafon: number;
  tenor: number;
  dp: number;
  purpose?: string;
  status: Status;
  documents: { type: DocumentType; fileName: string }[];
  extraction?: Extraction;
  score?: ScoreResult;
  log: DecisionLog[];
};

export type StoreState = {
  version: 2;
  applications: Application[];
  nextId: number;
};

export type ScoreInput = {
  plafon: number;
  tenor: number;
  thp: number;
  existingInstallment: number;
  incomeCv: number;
  salaryGap: number;
  worstKolektibilitas: number;
  lateCount: number;
  has90Plus: boolean;
};

export type Factor = {
  key: string;
  label: string;
  points: number;
  direction: "positive" | "negative" | "neutral";
  detail: string;
};

export type ScoreResult = {
  score: number;
  grade: Grade;
  dti: number;
  newInstallment: number;
  recommendation: string;
  factors: Factor[];
  allFactors: Factor[];
  guardrails: { id: string; label: string }[];
  narrative: string;
};
