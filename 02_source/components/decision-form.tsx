"use client";

import { useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import { ApiError, submitDecision } from "@/lib/api-client";
import type { Application, ReasonCode } from "@/lib/types";
import { REASON_CODES, validateDecision } from "@/lib/validation";
import { REASON_LABELS } from "./decision-log";

type DecisionValue = "Approved" | "Rejected";

export function DecisionForm({
  application,
  onSaved,
}: {
  application: Application;
  onSaved: (application: Application) => void;
}) {
  const guardrails = application.score?.guardrails ?? [];
  const guardrailIds = guardrails.map((guardrail) => guardrail.id);
  const finalStatus =
    application.status === "Approved" || application.status === "Rejected"
      ? (application.status as DecisionValue)
      : "";

  const [decision, setDecision] = useState<DecisionValue | "">(finalStatus);
  const [reasonCode, setReasonCode] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const approveRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLSelectElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const decisionErrorId = useId();
  const reasonErrorId = useId();
  const notesErrorId = useId();
  const guardrailHintId = useId();

  function focusFirstError(errorMap: Record<string, string>) {
    if (errorMap.decision) approveRef.current?.focus();
    else if (errorMap.reasonCode) reasonRef.current?.focus();
    else if (errorMap.notes) notesRef.current?.focus();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateDecision(
      { decision: decision as DecisionValue, reasonCode, notes },
      guardrailIds,
    );

    if (!validation.valid) {
      setErrors(validation.errors);
      setFormError(null);
      setNotice(null);
      focusFirstError(validation.errors);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setNotice(null);

    try {
      const updated = await submitDecision(application.id, {
        decision: decision as DecisionValue,
        reasonCode,
        notes: notes.trim() || undefined,
      });
      setErrors({});
      onSaved(updated);
      setNotice("Keputusan tersimpan.");
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(error.errors);
        focusFirstError(error.errors);
      } else {
        setErrors({});
        setFormError(
          error instanceof Error ? error.message : "Keputusan gagal disimpan.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  function pickFromBar(value: DecisionValue) {
    setDecision(value);
    setErrors((current) => {
      const next = { ...current };
      delete next.decision;
      return next;
    });
    document.getElementById("form-keputusan")?.scrollIntoView({ block: "start" });
    reasonRef.current?.focus({ preventScroll: true });
  }

  return (
    <>
      <form id="form-keputusan" onSubmit={handleSubmit} noValidate>
        <fieldset>
          <legend className="text-[13px] font-medium text-ink">Keputusan</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-control ${
                decision === "Approved"
                  ? "border-2 border-accent bg-accent-soft p-[11px]"
                  : "border border-accent bg-surface p-3 hover:bg-accent-soft"
              }`}
            >
              <input
                ref={approveRef}
                type="radio"
                name="keputusan"
                value="Approved"
                checked={decision === "Approved"}
                onChange={() => {
                  setDecision("Approved");
                  setErrors((current) => ({ ...current, decision: "" }));
                }}
                aria-describedby={errors.decision ? decisionErrorId : undefined}
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ accentColor: "var(--accent)" }}
              />
              <span>
                <span className="block text-sm font-semibold text-accent">Approve</span>
                <span className="block text-xs text-muted">
                  Setujui pengajuan sesuai plafon dan tenor.
                </span>
              </span>
            </label>

            <label
              className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-control ${
                decision === "Rejected"
                  ? "border-2 border-danger-ink bg-danger-bg p-[11px]"
                  : "border border-danger-ink bg-surface p-3 hover:bg-danger-bg"
              }`}
            >
              <input
                type="radio"
                name="keputusan"
                value="Rejected"
                checked={decision === "Rejected"}
                onChange={() => {
                  setDecision("Rejected");
                  setErrors((current) => ({ ...current, decision: "" }));
                }}
                aria-describedby={errors.decision ? decisionErrorId : undefined}
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ accentColor: "var(--danger-ink)" }}
              />
              <span>
                <span className="block text-sm font-semibold text-danger-ink">Reject</span>
                <span className="block text-xs text-muted">Tolak pengajuan ini.</span>
              </span>
            </label>
          </div>
          {errors.decision ? (
            <p id={decisionErrorId} className="mt-2 text-sm font-medium text-danger-ink">
              {errors.decision}
            </p>
          ) : null}
        </fieldset>

        <div className="mt-4">
          <label htmlFor="reason-code" className="block text-[13px] font-medium text-ink">
            Reason code
          </label>
          <select
            id="reason-code"
            ref={reasonRef}
            value={reasonCode}
            onChange={(event) => {
              setReasonCode(event.target.value);
              setErrors((current) => ({ ...current, reasonCode: "" }));
            }}
            aria-invalid={errors.reasonCode ? true : undefined}
            aria-describedby={errors.reasonCode ? reasonErrorId : undefined}
            className="mt-1 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink"
          >
            <option value="">Pilih reason code</option>
            {REASON_CODES.map((code: ReasonCode) => (
              <option key={code} value={code}>
                {code}: {REASON_LABELS[code]}
              </option>
            ))}
          </select>
          {errors.reasonCode ? (
            <p id={reasonErrorId} className="mt-2 text-sm font-medium text-danger-ink">
              {errors.reasonCode}
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          <label htmlFor="catatan" className="block text-[13px] font-medium text-ink">
            {guardrailIds.length > 0 ? "Catatan (wajib karena guardrail aktif)" : "Catatan (opsional)"}
          </label>
          {guardrailIds.length > 0 ? (
            <p id={guardrailHintId} className="mt-0.5 text-xs text-warn-ink">
              Guardrail aktif: {guardrailIds.join(", ")}.
            </p>
          ) : null}
          <textarea
            id="catatan"
            ref={notesRef}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setErrors((current) => ({ ...current, notes: "" }));
            }}
            rows={3}
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={
              errors.notes
                ? guardrailIds.length > 0
                  ? `${guardrailHintId} ${notesErrorId}`
                  : notesErrorId
                : guardrailIds.length > 0
                  ? guardrailHintId
                  : undefined
            }
            className="mt-1 block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-sm text-ink"
          />
          {errors.notes ? (
            <p id={notesErrorId} className="mt-2 text-sm font-medium text-danger-ink">
              {errors.notes}
            </p>
          ) : null}
        </div>

        <div className="mt-4" aria-live="polite">
          {formError ? (
            <p role="alert" className="text-sm font-medium text-danger-ink">
              {formError}
            </p>
          ) : null}
          {notice ? <p className="text-sm font-medium text-accent">{notice}</p> : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-control bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-hover disabled:bg-surface-muted disabled:text-muted"
        >
          {submitting ? "Menyimpan keputusan..." : "Simpan Keputusan"}
        </button>

        <p className="mt-2 text-xs text-muted">
          Keputusan dapat diubah. Setiap penyimpanan menambah entri log.
        </p>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden">
        <div className="mx-auto flex max-w-[1200px] gap-2">
          <button
            type="button"
            onClick={() => pickFromBar("Approved")}
            aria-label="Pilih Approve lalu isi reason code"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-control border border-accent bg-surface px-3 text-sm font-semibold text-accent hover:bg-accent-soft"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => pickFromBar("Rejected")}
            aria-label="Pilih Reject lalu isi reason code"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-control border border-danger-ink bg-surface px-3 text-sm font-semibold text-danger-ink hover:bg-danger-bg"
          >
            Reject
          </button>
        </div>
      </div>
    </>
  );
}
