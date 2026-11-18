const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatRupiah(value: number): string {
  return `Rp ${rupiah.format(value)}`;
}

// 15 digit masih di bawah Number.MAX_SAFE_INTEGER.
const MAX_AMOUNT_DIGITS = 15;

export function formatAmountInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_AMOUNT_DIGITS);
  return digits ? rupiah.format(Number(digits)) : "";
}

export function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/^rp\s*/i, "").replace(/[.\s]/g, "");
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

export function formatDecimal(value: number, digits = 2): string {
  return value.toFixed(digits).replace(".", ",");
}

export function formatPercent(ratio: number): string {
  return `${formatDecimal(ratio * 100, 1)}%`;
}

export function formatScore(score: number): string {
  return String(Math.round(score));
}

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}
