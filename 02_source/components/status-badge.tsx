import type { Status } from "@/lib/types";

const STATUS_STYLES: Record<Status, { text: string; chip: string }> = {
  Draft: { text: "text-muted", chip: "bg-surface-muted text-ink" },
  Scored: { text: "text-info-ink", chip: "bg-info-bg text-info-ink" },
  "Manual Review": { text: "text-warn-ink", chip: "bg-warn-bg text-warn-ink" },
  Approved: { text: "text-grade-a", chip: "bg-ok-bg text-grade-a" },
  Rejected: { text: "text-danger-ink", chip: "bg-danger-bg text-danger-ink" },
};

export function StatusBadge({
  status,
  variant = "chip",
}: {
  status: Status;
  variant?: "text" | "chip";
}) {
  const style = STATUS_STYLES[status];

  if (variant === "text") {
    return <span className={`text-xs font-semibold ${style.text}`}>{status}</span>;
  }

  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-control px-2 py-0.5 text-xs font-semibold ${style.chip}`}
    >
      {status}
    </span>
  );
}
