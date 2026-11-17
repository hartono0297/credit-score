import type { ReasonCode } from "./types";

export const TENORS = [3, 6, 12, 18, 24] as const;
export const MIN_PLAFON = 5_000_000;
export const MAX_PLAFON = 50_000_000;
export const MAX_DP_RATIO = 0.5;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const UPLOAD_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export const REASON_CODES: ReasonCode[] = [
  "INCOME_INSUFFICIENT",
  "DTI_EXCEEDED",
  "DELINQUENCY",
  "THIN_FILE",
  "DOC_MISMATCH",
  "OTHER",
];

export type ValidationErrors = Record<string, string>;

export type ValidationResult = { valid: boolean; errors: ValidationErrors };

export type NewApplicationInput = {
  profileId: string;
  plafon: number;
  tenor: number;
  dp: number;
};

export type DecisionInput = {
  decision: "Approved" | "Rejected";
  reasonCode?: string;
  notes?: string;
};

export function validateNewApplication(
  input: NewApplicationInput,
  profileIds: string[],
): ValidationResult {
  const errors: ValidationErrors = {};

  if (!profileIds.includes(input.profileId)) {
    errors.profileId = "Pilih profil demo.";
  }
  if (
    !Number.isFinite(input.plafon) ||
    input.plafon < MIN_PLAFON ||
    input.plafon > MAX_PLAFON
  ) {
    errors.plafon = "Plafon harus antara Rp 5.000.000 dan Rp 50.000.000.";
  }
  if (!TENORS.includes(input.tenor as (typeof TENORS)[number])) {
    errors.tenor = "Pilih tenor 3, 6, 12, 18, atau 24 bulan.";
  }
  if (!Number.isFinite(input.dp) || input.dp < 0 || input.dp > input.plafon * MAX_DP_RATIO) {
    errors.dp = "DP harus antara 0 dan 50% plafon.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateDecision(
  input: DecisionInput,
  activeGuardrails: string[],
): ValidationResult {
  const errors: ValidationErrors = {};

  if (input.decision !== "Approved" && input.decision !== "Rejected") {
    errors.decision = "Pilih Approve atau Reject.";
  }
  if (!input.reasonCode || !REASON_CODES.includes(input.reasonCode as ReasonCode)) {
    errors.reasonCode = "Pilih reason code.";
  }
  if (activeGuardrails.length > 0 && !input.notes?.trim()) {
    errors.notes = "Catatan wajib diisi saat guardrail aktif.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateUpload(file: { type: string; size: number }): string | null {
  if (!UPLOAD_TYPES.includes(file.type as (typeof UPLOAD_TYPES)[number])) {
    return "Format file harus JPG, PNG, atau PDF.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Ukuran file maksimal 10 MB.";
  }
  return null;
}

export function isApplicationId(id: string): boolean {
  return /^APP-\d{3}$/.test(id);
}
