import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div role="status" className="rounded-card bg-surface p-6">
      <p className="text-base font-semibold text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
