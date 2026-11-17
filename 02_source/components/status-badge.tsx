import type { Status } from "@/lib/types";

const STATUS_STYLES: Record<Status, { badge: string; dot: string }> = {
  Draft: { badge: "border-line-strong bg-surface-muted text-ink", dot: "bg-muted" },
  Scored: { badge: "border-info-ink/30 bg-info-bg text-info-ink", dot: "bg-info-ink" },
  "Manual Review": {
    badge: "border-warn-ink/40 bg-warn-bg text-warn-ink",
    dot: "bg-warn-ink",
  },
  Approved: { badge: "border-grade-a/40 bg-ok-bg text-grade-a", dot: "bg-grade-a" },
  Rejected: {
    badge: "border-danger-ink/40 bg-danger-bg text-danger-ink",
    dot: "bg-danger-ink",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-control border px-2 py-0.5 text-xs font-semibold ${style.badge}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
