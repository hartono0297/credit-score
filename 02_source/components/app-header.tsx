"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useState } from "react";
import { resetDemo } from "@/lib/api-client";

export function AppHeader() {
  const router = useRouter();
  const isQueue = usePathname() === "/";
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
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-3 py-2 md:px-4 lg:px-8">
        <div className="min-w-0">
          <Link href="/" className="inline-flex min-h-11 items-center text-[15px] font-semibold leading-snug text-ink">
            AI Credit Scoring Assistant
          </Link>
          <p role="note" className="-mt-2 text-xs text-muted">
            Demo Mode: data simulasi
          </p>
        </div>

        <nav aria-label="Aksi utama" className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setConfirming((value) => !value);
              setError(null);
            }}
            aria-expanded={confirming}
            aria-controls={panelId}
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
          >
            Reset Demo
          </button>
          <Link
            href="/new"
            data-variant={isQueue ? "primary" : "secondary"}
            className={
              isQueue
                ? "inline-flex min-h-11 items-center rounded-control bg-ink px-3 text-sm font-semibold text-white hover:bg-ink-hover"
                : "inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted"
            }
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
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-3 py-3 md:px-4 lg:px-8">
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
