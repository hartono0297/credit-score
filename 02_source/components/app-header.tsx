"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { resetDemo } from "@/lib/api-client";

export function AppHeader() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelId = useId();

  async function handleReset() {
    setResetting(true);
    setError(null);

    try {
      await resetDemo();
      window.dispatchEvent(new Event("demo-reset"));
      router.push("/");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Reset gagal.");
      setResetting(false);
    }
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
        <Link href="/" className="min-w-0">
          <span className="block text-base font-semibold tracking-tight text-ink">
            AI Credit Scoring Assistant
          </span>
          <span className="block text-xs text-muted">Demo untuk credit analyst BNPL</span>
        </Link>

        <nav aria-label="Aksi utama" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming((value) => !value);
              setError(null);
            }}
            aria-expanded={confirming}
            aria-controls={panelId}
            className="inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            Reset Demo
          </button>
          <Link
            href="/new"
            className="inline-flex min-h-11 items-center rounded-control bg-accent px-3 text-sm font-semibold text-accent-ink hover:bg-accent/90"
          >
            Aplikasi Baru
          </Link>
        </nav>
      </div>

      <div
        id={panelId}
        aria-live="polite"
        className={confirming ? "border-t border-line bg-surface-muted" : ""}
      >
        {confirming ? (
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3 lg:px-8">
            <p className="min-w-0 flex-1 text-sm text-ink">
              Reset menghapus perubahan dan memuat ulang lima aplikasi demo.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex min-h-11 items-center rounded-control bg-danger-ink px-3 text-sm font-semibold text-white hover:bg-danger-ink/90 disabled:bg-surface-muted disabled:text-muted"
              >
                {resetting ? "Meriset data..." : "Ya, reset demo"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirming(false);
                  setError(null);
                }}
                disabled={resetting}
                className="inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
              >
                Batal
              </button>
            </div>
            {error ? (
              <p role="alert" className="w-full text-sm font-medium text-danger-ink">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
