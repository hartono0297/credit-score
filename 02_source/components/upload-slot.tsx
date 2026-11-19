"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { MAX_UPLOAD_BYTES, UPLOAD_TYPES } from "@/lib/validation";
import type { DocumentType } from "@/lib/types";

const EXTENSIONS = ["jpg", "jpeg", "png", "pdf"];

function extensionOf(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

function validateFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return "Ukuran file maksimal 10 MB.";
  if (UPLOAD_TYPES.includes(file.type as (typeof UPLOAD_TYPES)[number])) return null;
  // Sebagian browser dan test runner mengosongkan MIME, jadi ekstensi dipakai sebagai cadangan.
  if (EXTENSIONS.includes(extensionOf(file.name))) return null;
  return "Format file harus JPG, PNG, atau PDF.";
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/") || /\.(jpe?g|png)$/i.test(file.name);
}

export function UploadSlot({
  documentType,
  label,
  description,
  file,
  onFileChange,
  disabled = false,
}: {
  documentType: DocumentType;
  label: string;
  description: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function replacePreview(selected: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = selected && isImage(selected) ? URL.createObjectURL(selected) : null;
    previewRef.current = url;
    setPreviewUrl(url);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) {
      replacePreview(null);
      onFileChange(null);
      setError(null);
      return;
    }

    const nextError = validateFile(selected);
    if (nextError) {
      replacePreview(null);
      setError(nextError);
      onFileChange(null);
      event.target.value = "";
      return;
    }

    replacePreview(selected);
    setError(null);
    onFileChange(selected);
  }

  const describedBy = error ? `${hintId} ${errorId}` : hintId;

  return (
    <div className="rounded-control border border-dashed border-line-strong bg-surface p-3">
      <label htmlFor={inputId} className="block text-[13px] font-medium text-ink">
        {label}
      </label>
      <p id={hintId} className="mt-0.5 text-xs text-muted">
        {description}
      </p>
      <input
        ref={inputRef}
        id={inputId}
        name={`dokumen-${documentType}`}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
        onChange={handleChange}
        disabled={disabled}
        tabIndex={-1}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="sr-only"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        aria-label={`${file ? "Ganti" : "Pilih file"} ${label}`}
        aria-describedby={describedBy}
        className="mt-2 inline-flex min-h-11 items-center rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-muted disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted"
      >
        {file ? "Ganti" : "Pilih file"}
      </button>

      {file ? (
        <div className="mt-3 flex items-center gap-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob preview is local and not optimizable
            <img
              src={previewUrl}
              alt={`Pratinjau ${label}`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-control border border-line object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <p className="break-all text-sm text-ink">{file.name}</p>
            <p className="text-xs text-muted">
              {previewUrl ? "Pratinjau gambar" : "PDF, pratinjau tidak tersedia"}
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-2 text-sm font-medium text-danger-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
