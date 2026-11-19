"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatAmountInput, formatDecimal, formatRupiah, parseAmount } from "@/lib/format";
import type { Extraction } from "@/lib/types";
import { ConfidenceChip } from "./confidence-chip";
import { RupiahInput } from "./rupiah-input";

export type CorrectableField = "thp" | "cicilanTerdeteksi" | "inflowBulanan";

type ExtractionListProps = {
  extraction: Extraction;
  canEdit: boolean;
  pending?: Partial<Record<CorrectableField, number>>;
  onSaveCorrection: (field: CorrectableField, value: number) => Promise<void> | void;
  errors?: Partial<Record<CorrectableField, string>>;
  disabled?: boolean;
};

function CorrectableRow({
  field,
  label,
  value,
  confidence,
  edited,
  canEdit,
  pendingValue,
  error,
  onSave,
  disabled,
}: {
  field: CorrectableField;
  label: string;
  value: number;
  confidence: number;
  edited?: boolean;
  canEdit: boolean;
  pendingValue?: number;
  error?: string;
  onSave: (field: CorrectableField, value: number) => Promise<void> | void;
  disabled: boolean;
}) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const displayValue = pendingValue ?? value;
  const shownError = localError ?? error;

  function startEditing() {
    setDraft(formatAmountInput(String(displayValue)));
    setLocalError(null);
    setEditing(true);
  }

  async function save() {
    const amount = parseAmount(draft);
    if (!Number.isSafeInteger(amount)) {
      setLocalError("Masukkan nominal Rupiah.");
      return;
    }

    setSaving(true);
    setLocalError(null);
    try {
      await onSave(field, amount);
      setEditing(false);
    } catch (saveError) {
      setLocalError(
        saveError instanceof Error ? saveError.message : "Koreksi gagal disimpan.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted">{label}</dt>
          <dd className="mt-0.5 text-sm font-semibold text-ink">{formatRupiah(displayValue)}</dd>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <ConfidenceChip confidence={confidence} />
            {pendingValue !== undefined ? (
              <span className="text-xs font-semibold text-accent">Koreksi belum disimpan</span>
            ) : edited ? (
              <span className="text-xs font-medium text-accent">Hasil koreksi analyst</span>
            ) : null}
          </div>
        </div>
        {canEdit && !editing ? (
          <button
            type="button"
            onClick={startEditing}
            disabled={disabled}
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-accent hover:bg-surface-muted disabled:text-muted"
          >
            Ubah
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 rounded-control bg-surface-muted p-3">
          <label htmlFor={inputId} className="block text-xs font-semibold text-ink">
            Nilai baru untuk {label} (Rupiah)
          </label>
          <RupiahInput
            id={inputId}
            ref={inputRef}
            value={draft}
            onValueChange={setDraft}
            disabled={saving}
            aria-invalid={shownError ? true : undefined}
            aria-describedby={shownError ? `${hintId} ${errorId}` : hintId}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void save();
              }
            }}
          />
          <p id={hintId} className="mt-1 text-xs text-muted">
            Titik ribuan ditambahkan otomatis.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-line disabled:bg-surface-muted disabled:text-muted"
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setLocalError(null);
              }}
              disabled={saving}
              className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-muted hover:bg-line disabled:text-muted"
            >
              Batal
            </button>
          </div>
        </div>
      ) : null}

      {shownError ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-danger-ink">
          {shownError}
        </p>
      ) : null}
    </div>
  );
}

export function ExtractionList({
  extraction,
  canEdit,
  pending = {},
  onSaveCorrection,
  errors = {},
  disabled = false,
}: ExtractionListProps) {
  return (
    <div className="space-y-4">
      <section aria-labelledby="extraction-ktp">
        <h3 id="extraction-ktp" className="text-sm font-semibold text-ink">
          KTP
        </h3>
        <dl className="mt-1 divide-y divide-line">
          <div className="py-3">
            <dt className="text-xs font-medium text-muted">Nama</dt>
            <dd className="mt-0.5 text-sm text-ink">{extraction.ktp.nama.value}</dd>
            <dd className="mt-1">
              <ConfidenceChip confidence={extraction.ktp.nama.confidence} />
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-medium text-muted">NIK</dt>
            <dd className="mt-0.5 text-sm text-ink">{extraction.ktp.nik.value}</dd>
            <dd className="mt-1">
              <ConfidenceChip confidence={extraction.ktp.nik.confidence} />
            </dd>
          </div>
          <div className="py-3">
            <dt className="text-xs font-medium text-muted">Tanggal lahir</dt>
            <dd className="mt-0.5 text-sm text-ink">{extraction.ktp.tanggalLahir.value}</dd>
            <dd className="mt-1">
              <ConfidenceChip confidence={extraction.ktp.tanggalLahir.confidence} />
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="extraction-slip">
        <h3 id="extraction-slip" className="text-sm font-semibold text-ink">
          Slip gaji
        </h3>
        <dl className="mt-1 divide-y divide-line">
          <div className="py-3">
            <dt className="text-xs font-medium text-muted">Employer</dt>
            <dd className="mt-0.5 text-sm text-ink">{extraction.slipGaji.employer.value}</dd>
            <dd className="mt-1">
              <ConfidenceChip confidence={extraction.slipGaji.employer.confidence} />
            </dd>
          </div>
          <CorrectableRow
            field="thp"
            label="THP"
            value={extraction.slipGaji.thp.value}
            confidence={extraction.slipGaji.thp.confidence}
            edited={extraction.slipGaji.thp.edited}
            canEdit={canEdit}
            pendingValue={pending.thp}
            error={errors.thp}
            onSave={onSaveCorrection}
            disabled={disabled}
          />
          <div className="py-3">
            <dt className="text-xs font-medium text-muted">Masa kerja</dt>
            <dd className="mt-0.5 text-sm text-ink">
              {formatDecimal(extraction.slipGaji.masaKerjaBulan.value, 0)} bulan
            </dd>
            <dd className="mt-1">
              <ConfidenceChip confidence={extraction.slipGaji.masaKerjaBulan.confidence} />
            </dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="extraction-mutasi">
        <h3 id="extraction-mutasi" className="text-sm font-semibold text-ink">
          Mutasi rekening
        </h3>
        <dl className="mt-1 divide-y divide-line">
          <div className="py-3">
            <dt className="text-xs font-medium text-muted">Rata-rata saldo</dt>
            <dd className="mt-0.5 text-sm font-semibold text-ink">
              {formatRupiah(extraction.mutasi.rataRataSaldo.value)}
            </dd>
            <dd className="mt-1">
              <ConfidenceChip confidence={extraction.mutasi.rataRataSaldo.confidence} />
            </dd>
          </div>
          <CorrectableRow
            field="inflowBulanan"
            label="Inflow bulanan"
            value={extraction.mutasi.inflowBulanan.value}
            confidence={extraction.mutasi.inflowBulanan.confidence}
            edited={extraction.mutasi.inflowBulanan.edited}
            canEdit={canEdit}
            pendingValue={pending.inflowBulanan}
            error={errors.inflowBulanan}
            onSave={onSaveCorrection}
            disabled={disabled}
          />
          <CorrectableRow
            field="cicilanTerdeteksi"
            label="Cicilan terdeteksi"
            value={extraction.mutasi.cicilanTerdeteksi.value}
            confidence={extraction.mutasi.cicilanTerdeteksi.confidence}
            edited={extraction.mutasi.cicilanTerdeteksi.edited}
            canEdit={canEdit}
            pendingValue={pending.cicilanTerdeteksi}
            error={errors.cicilanTerdeteksi}
            onSave={onSaveCorrection}
            disabled={disabled}
          />
        </dl>
      </section>
    </div>
  );
}
