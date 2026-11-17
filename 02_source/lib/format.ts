const rupiah = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

const dateTime = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

export function formatRupiah(value: number): string {
  return `Rp ${rupiah.format(value)}`;
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
