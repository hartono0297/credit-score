"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { QueueTable } from "@/components/queue-table";
import { listApplications } from "@/lib/api-client";
import type { Application } from "@/lib/types";

function LoadingQueue() {
  return (
    <div aria-busy="true">
      <p role="status" className="text-sm text-muted">
        Memuat aplikasi...
      </p>
      <ul className="mt-3 divide-y divide-line rounded-card bg-surface">
        {[0, 1, 2].map((row) => (
          <li key={row} className="flex items-center justify-between gap-4 px-4 py-4">
            <div className="w-full max-w-xs animate-pulse space-y-2">
              <div className="h-3.5 w-2/3 rounded-[2px] bg-surface-muted" />
              <div className="h-3 w-1/3 rounded-[2px] bg-surface-muted" />
            </div>
            <div className="h-7 w-24 animate-pulse rounded-control bg-surface-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

type LoadResult = { key: number; applications: Application[] } | { key: number; error: string };

export default function QueuePage() {
  const [result, setResult] = useState<LoadResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const key = reloadKey;

    listApplications()
      .then((data) => {
        if (active) setResult({ key, applications: data });
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setResult({
          key,
          error: loadError instanceof Error ? loadError.message : "Gagal memuat aplikasi.",
        });
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    function handleReset() {
      setReloadKey((key) => key + 1);
    }

    window.addEventListener("demo-reset", handleReset);
    return () => window.removeEventListener("demo-reset", handleReset);
  }, []);

  const current = result && result.key === reloadKey ? result : null;
  const applications = current && "applications" in current ? current.applications : null;
  const error = current && "error" in current ? current.error : null;

  const manualReview =
    applications?.filter((application) => application.status === "Manual Review").length ?? 0;
  const approved =
    applications?.filter((application) => application.status === "Approved").length ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold leading-tight text-ink">Queue aplikasi</h1>
          <p className="mt-1 text-sm text-muted">
            Aplikasi BNPL yang menunggu review analyst.
          </p>
        </div>
      </div>

      {applications !== null ? (
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-xs font-medium text-muted">Total aplikasi</dt>
            <dd className="text-2xl font-semibold text-ink">{applications.length}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Manual review</dt>
            <dd className="text-2xl font-semibold text-warn-ink">{manualReview}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted">Approved</dt>
            <dd className="text-2xl font-semibold text-grade-a">{approved}</dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-4">
        {error ? (
          <div role="alert" className="rounded-control bg-danger-bg p-4">
            <p className="text-sm font-semibold text-danger-ink">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-3 inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
            >
              Coba lagi
            </button>
          </div>
        ) : applications === null ? (
          <LoadingQueue />
        ) : applications.length === 0 ? (
          <EmptyState title="Belum ada aplikasi. Mulai dengan Aplikasi Baru.">
            <Link
              href="/new"
              className="inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
            >
              Aplikasi Baru
            </Link>
          </EmptyState>
        ) : (
          <QueueTable applications={applications} />
        )}
      </div>
    </div>
  );
}
