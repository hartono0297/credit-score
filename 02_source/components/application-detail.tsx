"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ApiError, getApplication, updateExtraction } from "@/lib/api-client";
import type { CorrectableField } from "@/components/extraction-list";
import { DecisionForm } from "@/components/decision-form";
import { DecisionLog } from "@/components/decision-log";
import { EmptyState } from "@/components/empty-state";
import { ExtractionList } from "@/components/extraction-list";
import { FactorBar } from "@/components/factor-bar";
import { GuardrailBanner } from "@/components/guardrail-banner";
import { ScoreBadge } from "@/components/score-badge";
import { SlikTable } from "@/components/slik-table";
import { StatusBadge } from "@/components/status-badge";
import { formatRupiah } from "@/lib/format";
import type { Application, Profile } from "@/lib/types";
import { isApplicationId } from "@/lib/validation";

const DOCUMENT_LABELS: Record<string, string> = {
  KTP: "KTP",
  SLIP_GAJI: "Slip gaji",
  MUTASI: "Mutasi rekening",
};

function BackToQueue() {
  return (
    <Link
      href="/"
      className="inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-accent hover:bg-accent-soft"
    >
      Kembali ke queue
    </Link>
  );
}

function DisclosureSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details
      open
      className="group rounded-panel border border-line bg-surface lg:[&>div]:block"
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 [&::-webkit-details-marker]:hidden lg:pointer-events-none lg:cursor-default">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <span aria-hidden="true" className="text-xs text-muted lg:hidden">
          <span className="group-open:hidden">Tampilkan</span>
          <span className="hidden group-open:inline">Sembunyikan</span>
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}

type DetailResult =
  | { key: string; application: Application; profile: Profile }
  | { key: string; notFound: true }
  | { key: string; error: string };

export function ApplicationDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const validId = isApplicationId(id);

  const [result, setResult] = useState<DetailResult | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadKey = `${id}:${reloadKey}`;
  const current = result && result.key === loadKey ? result : null;
  const application = current && "application" in current ? current.application : null;
  const profile = current && "application" in current ? current.profile : null;
  const notFound = current !== null && "notFound" in current;
  const error = current && "error" in current ? current.error : null;
  const loading = validId && current === null;

  useEffect(() => {
    if (!validId) return;

    let active = true;
    const key = `${id}:${reloadKey}`;

    getApplication(id)
      .then((data) => {
        if (active) setResult({ key, application: data.application, profile: data.profile });
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (loadError instanceof ApiError && loadError.status === 404) {
          setResult({ key, notFound: true });
        } else {
          setResult({
            key,
            error: loadError instanceof Error ? loadError.message : "Gagal memuat aplikasi.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id, validId, reloadKey]);

  async function saveCorrection(field: CorrectableField, value: number) {
    if (!application || !profile) return;

    try {
      const updated = await updateExtraction(application.id, { [field]: value });
      setResult({ key: loadKey, application: updated, profile });
    } catch (saveError) {
      if (saveError instanceof ApiError) {
        throw new Error(saveError.errors?.[field] ?? saveError.message);
      }
      throw saveError;
    }
  }

  function handleDecisionSaved(updated: Application) {
    if (!profile) return;
    setResult({ key: loadKey, application: updated, profile });
  }

  if (!validId) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Detail aplikasi</h1>
        <div className="mt-4">
          <EmptyState
            title="ID aplikasi tidak valid."
            description="Buka aplikasi dari queue agar ID berbentuk APP-XXX."
          >
            <BackToQueue />
          </EmptyState>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Detail aplikasi</h1>
        <p role="status" className="mt-4 text-sm text-muted">
          Memuat aplikasi...
        </p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Detail aplikasi</h1>
        <div className="mt-4">
          <EmptyState
            title="Aplikasi tidak ditemukan."
            description="Aplikasi mungkin sudah direset. Buka queue untuk melihat daftar terbaru."
          >
            <BackToQueue />
          </EmptyState>
        </div>
      </div>
    );
  }

  if (error || !application || !profile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Detail aplikasi</h1>
        <div role="alert" className="mt-4 rounded-card border border-danger-ink bg-danger-bg p-4">
          <p className="text-sm font-semibold text-danger-ink">
            {error ?? "Data aplikasi tidak lengkap."}
          </p>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            className="mt-3 inline-flex min-h-11 items-center rounded-control border border-danger-ink bg-surface px-3 text-sm font-semibold text-danger-ink"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const { score } = application;
  const correctionAllowed =
    application.status !== "Approved" && application.status !== "Rejected";
  const maxAbs = score
    ? Math.max(...score.factors.map((factor) => Math.abs(factor.points)), 1)
    : 1;

  return (
    <div className="pb-20 md:pb-0">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="min-w-0 space-y-4">
          <section aria-labelledby="ringkasan-title" className="rounded-panel border border-line bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted">
                  {application.id}, {application.profileId}, {application.product}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
                  {application.customerName}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  Plafon {formatRupiah(application.plafon)}, tenor {application.tenor} bulan, DP{" "}
                  {formatRupiah(application.dp)}
                </p>
                {application.purpose ? (
                  <p className="mt-1 text-sm text-ink">Tujuan: {application.purpose}</p>
                ) : null}
              </div>
              <StatusBadge status={application.status} />
            </div>

            <h2 id="ringkasan-title" className="sr-only">
              Ringkasan
            </h2>

            {score ? (
              <div className="mt-4 border-t border-line pt-4">
                <ScoreBadge score={score.score} grade={score.grade} size="lg" />
                <p className="mt-3 text-sm leading-relaxed text-ink">
                  <span className="font-semibold">Rekomendasi: </span>
                  {score.recommendation}
                </p>
                <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-muted">
                  {score.narrative}
                </p>
                {score.guardrails.length > 0 ? (
                  <div className="mt-4">
                    <GuardrailBanner guardrails={score.guardrails} />
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
                Skor belum tersedia. Ekstrak dokumen terlebih dahulu.
              </p>
            )}
          </section>

          <DisclosureSection title="Dokumen">
            {application.documents.length > 0 ? (
              <ul className="space-y-2">
                {application.documents.map((document) => (
                  <li
                    key={document.type}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2 last:border-b-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-ink">
                      {DOCUMENT_LABELS[document.type] ?? document.type}
                    </span>
                    <span className="break-all text-sm text-muted">{document.fileName}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Belum ada dokumen yang diunggah.</p>
            )}

            <div className="mt-4">
              {application.extraction ? (
                <>
                  <ExtractionList
                    extraction={application.extraction}
                    canEdit={correctionAllowed}
                    onSaveCorrection={saveCorrection}
                  />
                  {!correctionAllowed ? (
                    <p className="mt-2 text-xs text-muted">
                      Koreksi dinonaktifkan setelah keputusan final.
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted">Hasil ekstraksi belum tersedia.</p>
              )}
            </div>
          </DisclosureSection>

          <DisclosureSection title="SLIK">
            <SlikTable facilities={profile.slik} />
          </DisclosureSection>
        </div>

        <div className="min-w-0 space-y-4">
          <DisclosureSection title="Faktor risiko">
            {score ? (
              <div>
                <div className="space-y-4">
                  {score.factors.map((factor) => (
                    <FactorBar key={factor.key} factor={factor} maxAbs={maxAbs} />
                  ))}
                </div>
                <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">
                  {score.narrative}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Faktor risiko tampil setelah skor tersedia.</p>
            )}
          </DisclosureSection>

          <section
            aria-labelledby="keputusan-title"
            className="rounded-panel border border-line bg-surface p-4 lg:sticky lg:top-4"
          >
            <h2 id="keputusan-title" className="text-base font-semibold text-ink">
              Keputusan
            </h2>
            <div className="mt-3">
              {score && application.status !== "Draft" ? (
                <DecisionForm application={application} onSaved={handleDecisionSaved} />
              ) : (
                <p className="text-sm text-muted">
                  Keputusan tersedia setelah ekstraksi dan skor selesai.
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-line pt-4">
              <h3 className="text-sm font-semibold text-ink">Log keputusan</h3>
              <div className="mt-2">
                <DecisionLog entries={application.log} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
