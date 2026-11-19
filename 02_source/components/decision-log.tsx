import { formatDateTime } from "@/lib/format";
import type { DecisionLog as DecisionLogEntry, ReasonCode } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export const REASON_LABELS: Record<ReasonCode, string> = {
  INCOME_INSUFFICIENT: "Penghasilan tidak cukup",
  DTI_EXCEEDED: "DTI melebihi batas",
  DELINQUENCY: "Riwayat tunggakan",
  THIN_FILE: "Riwayat kredit terbatas",
  DOC_MISMATCH: "Dokumen tidak sesuai",
  OTHER: "Lainnya",
};

export function DecisionLog({ entries }: { entries: DecisionLogEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted">Belum ada keputusan untuk aplikasi ini.</p>;
  }

  const newestFirst = entries
    .map((entry, index) => ({ entry, index }))
    .sort(
      (left, right) =>
        new Date(right.entry.timestamp).getTime() - new Date(left.entry.timestamp).getTime() ||
        right.index - left.index,
    );

  return (
    <ol className="divide-y divide-line">
      {newestFirst.map(({ entry, index }) => (
        <li
          key={`${entry.timestamp}-${index}`}
          className="py-3 first:pt-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={entry.decision} />
            <p className="text-xs text-muted">{formatDateTime(entry.timestamp)}</p>
          </div>
          <p className="mt-2 text-sm text-ink">
            <span className="font-medium">{entry.reasonCode}</span>
            <span className="text-muted"> · {REASON_LABELS[entry.reasonCode]}</span>
          </p>
          {entry.notes ? (
            <p className="mt-1 whitespace-pre-line text-sm text-muted">{entry.notes}</p>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            {entry.activeGuardrails.length > 0
              ? `Guardrail aktif: ${entry.activeGuardrails.join(", ")}`
              : "Tidak ada guardrail aktif"}
          </p>
        </li>
      ))}
    </ol>
  );
}
