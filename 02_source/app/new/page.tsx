"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, createApplication, extractApplication, listProfiles, updateExtraction } from "@/lib/api-client";
import { formatRupiah } from "@/lib/format";
import { ExtractionList } from "@/components/extraction-list";
import type { CorrectableField } from "@/components/extraction-list";
import { UploadSlot } from "@/components/upload-slot";
import type { Application, DocumentType, Profile } from "@/lib/types";
import { MAX_DP_RATIO, TENORS, validateNewApplication } from "@/lib/validation";

const DOCUMENTS: { type: DocumentType; label: string }[] = [
  { type: "KTP", label: "KTP" },
  { type: "SLIP_GAJI", label: "Slip gaji" },
  { type: "MUTASI", label: "Mutasi rekening" },
];

const FIELD_ORDER = ["profileId", "plafon", "tenor", "dp", "purpose", "documents"] as const;

function parseAmount(raw: string): number {
  const cleaned = raw.trim().replace(/^rp\s*/i, "").replace(/[.\s]/g, "");
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

function describedBy(...ids: (string | undefined)[]): string | undefined {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

type ProfilesResult = { key: number; profiles: Profile[] } | { key: number; error: string };

export default function NewApplicationPage() {
  const router = useRouter();

  const [profilesResult, setProfilesResult] = useState<ProfilesResult | null>(null);
  const [profilesKey, setProfilesKey] = useState(0);
  const currentProfiles = profilesResult && profilesResult.key === profilesKey ? profilesResult : null;
  const profiles = currentProfiles && "profiles" in currentProfiles ? currentProfiles.profiles : null;
  const profilesError = currentProfiles && "error" in currentProfiles ? currentProfiles.error : null;

  const [profileId, setProfileId] = useState("");
  const [plafonText, setPlafonText] = useState("");
  const [tenor, setTenor] = useState("");
  const [dpText, setDpText] = useState("");
  const [purpose, setPurpose] = useState("");

  const [files, setFiles] = useState<Record<DocumentType, File | null>>({
    KTP: null,
    SLIP_GAJI: null,
    MUTASI: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [pending, setPending] = useState<Partial<Record<CorrectableField, number>>>({});
  const [correctionErrors, setCorrectionErrors] = useState<
    Partial<Record<CorrectableField, string>>
  >({});
  const [calculating, setCalculating] = useState(false);

  const profileRef = useRef<HTMLSelectElement>(null);
  const plafonRef = useRef<HTMLInputElement>(null);
  const tenorRef = useRef<HTMLSelectElement>(null);
  const dpRef = useRef<HTMLInputElement>(null);
  const purposeRef = useRef<HTMLInputElement>(null);
  const uploadsRef = useRef<HTMLDivElement>(null);

  const locked = createdId !== null;
  const allFilesReady = DOCUMENTS.every((document) => files[document.type] !== null);
  const selectedProfile = profiles?.find((profile) => profile.id === profileId);
  const plafonValue = parseAmount(plafonText);
  const dpLimit = Number.isFinite(plafonValue) ? Math.floor(plafonValue * MAX_DP_RATIO) : null;

  useEffect(() => {
    let active = true;
    const key = profilesKey;

    listProfiles()
      .then((data) => {
        if (active) setProfilesResult({ key, profiles: data });
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setProfilesResult({
          key,
          error: loadError instanceof Error ? loadError.message : "Gagal memuat profil demo.",
        });
      });

    return () => {
      active = false;
    };
  }, [profilesKey]);

  function focusFirstError(errorMap: Record<string, string>) {
    const first = FIELD_ORDER.find((field) => errorMap[field]);
    if (first === "profileId") profileRef.current?.focus();
    else if (first === "plafon") plafonRef.current?.focus();
    else if (first === "tenor") tenorRef.current?.focus();
    else if (first === "dp") dpRef.current?.focus();
    else if (first === "purpose") purposeRef.current?.focus();
    else if (first === "documents") uploadsRef.current?.focus();
  }

  async function handleExtract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked || extracting) return;
    if (!profiles) return;

    const plafon = parseAmount(plafonText);
    const dp = parseAmount(dpText);
    const nextErrors: Record<string, string> = {};

    const validation = validateNewApplication(
      {
        profileId,
        plafon,
        tenor: Number(tenor),
        dp,
      },
      profiles.map((profile) => profile.id),
    );
    Object.assign(nextErrors, validation.errors);

    if (Number.isNaN(plafon)) nextErrors.plafon = "Masukkan angka plafon.";
    if (Number.isNaN(dp)) nextErrors.dp = "Masukkan angka DP.";

    for (const document of DOCUMENTS) {
      if (!files[document.type]) {
        nextErrors.documents = "Unggah KTP, slip gaji, dan mutasi rekening.";
        break;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError(null);
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setExtracting(true);

    try {
      let id: string | null = createdId;
      if (!id) {
        id = await createApplication({
          profileId,
          plafon,
          tenor: Number(tenor),
          dp,
          purpose: purpose.trim() || undefined,
          documents: DOCUMENTS.map((document) => ({
            type: document.type,
            fileName: files[document.type]!.name,
          })),
        });
        setCreatedId(id);
      }

      const extracted = await extractApplication(id);
      setApplication(extracted);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        setErrors(error.errors);
        focusFirstError(error.errors);
      } else {
        setFormError(
          error instanceof Error ? error.message : "Gagal mengekstrak dokumen.",
        );
      }
    } finally {
      setExtracting(false);
    }
  }

  function handleSavePending(field: CorrectableField, value: number) {
    setPending((current) => ({ ...current, [field]: value }));
    setCorrectionErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleScore() {
    if (!createdId || calculating) return;

    setCalculating(true);
    setCorrectionErrors({});
    setFormError(null);

    try {
      if (Object.keys(pending).length > 0) {
        await updateExtraction(createdId, pending);
      }
      router.push(`/application?id=${encodeURIComponent(createdId)}`);
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        const nextErrors: Partial<Record<CorrectableField, string>> = {};
        for (const field of ["thp", "cicilanTerdeteksi", "inflowBulanan"] as const) {
          if (error.errors[field]) nextErrors[field] = error.errors[field];
        }
        if (Object.keys(nextErrors).length > 0) {
          setCorrectionErrors(nextErrors);
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError(error instanceof Error ? error.message : "Gagal menghitung skor.");
      }
      setCalculating(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Aplikasi baru</h1>
      <p className="mt-1 text-sm text-muted">
        Pilih profil demo, isi data pengajuan, dan unggah tiga dokumen.
      </p>

      <form onSubmit={handleExtract} noValidate className="mt-4 space-y-4">
        <section aria-labelledby="data-title" className="rounded-panel border border-line bg-surface p-4">
          <h2 id="data-title" className="text-base font-semibold text-ink">
            Data aplikasi
          </h2>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="profil" className="block text-sm font-semibold text-ink">
                Profil demo
              </label>
              <select
                id="profil"
                ref={profileRef}
                value={profileId}
                onChange={(event) => {
                  setProfileId(event.target.value);
                  setErrors((current) => ({ ...current, profileId: "" }));
                }}
                disabled={locked || profiles === null}
                required
                aria-invalid={errors.profileId ? true : undefined}
                aria-describedby={describedBy("profil-desc", errors.profileId ? "profil-error" : undefined)}
                className="mt-1 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink disabled:bg-surface-muted disabled:text-muted"
              >
                <option value="">
                  {profilesError
                    ? "Profil demo gagal dimuat"
                    : profiles
                      ? "Pilih profil demo"
                      : "Memuat profil demo..."}
                </option>
                {profiles?.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.id}: {profile.name}
                  </option>
                ))}
              </select>

              {profilesError ? (
                <div role="alert" className="mt-2 text-sm text-danger-ink">
                  <p>{profilesError}</p>
                  <button
                    type="button"
                    onClick={() => setProfilesKey((key) => key + 1)}
                    className="mt-2 inline-flex min-h-11 items-center rounded-control border border-danger-ink bg-surface px-3 text-sm font-semibold text-danger-ink"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : null}

              {selectedProfile ? (
                <p id="profil-desc" className="mt-1 text-xs text-muted">
                  {selectedProfile.employer}. THP {formatRupiah(selectedProfile.thp)}, cicilan{" "}
                  {formatRupiah(selectedProfile.existingInstallment)}, kolektibilitas{" "}
                  {selectedProfile.worstKolektibilitas}.
                </p>
              ) : (
                <p id="profil-desc" className="mt-1 text-xs text-muted">
                  Nilai ekstraksi diambil dari profil demo terpilih.
                </p>
              )}

              {errors.profileId ? (
                <p id="profil-error" className="mt-1 text-sm font-medium text-danger-ink">
                  {errors.profileId}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="produk" className="block text-sm font-semibold text-ink">
                Produk
              </label>
              <select
                id="produk"
                defaultValue="BNPL"
                disabled
                className="mt-1 block min-h-11 w-full rounded-control border border-line-strong bg-surface-muted px-3 text-sm text-muted"
              >
                <option value="BNPL">BNPL</option>
              </select>
            </div>

            <div>
              <label htmlFor="plafon" className="block text-sm font-semibold text-ink">
                Plafon (Rupiah)
              </label>
              <input
                id="plafon"
                ref={plafonRef}
                type="text"
                inputMode="numeric"
                value={plafonText}
                onChange={(event) => {
                  setPlafonText(event.target.value);
                  setErrors((current) => ({ ...current, plafon: "" }));
                }}
                disabled={locked}
                placeholder="15000000"
                required
                aria-invalid={errors.plafon ? true : undefined}
                aria-describedby={describedBy("plafon-hint", errors.plafon ? "plafon-error" : undefined)}
                className="mt-1 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink disabled:bg-surface-muted disabled:text-muted"
              />
              <p id="plafon-hint" className="mt-1 text-xs text-muted">
                Rp 5.000.000 sampai Rp 50.000.000. Contoh: 15000000 atau Rp 15.000.000.
              </p>
              {errors.plafon ? (
                <p id="plafon-error" className="mt-1 text-sm font-medium text-danger-ink">
                  {errors.plafon}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="tenor" className="block text-sm font-semibold text-ink">
                Tenor
              </label>
              <select
                id="tenor"
                ref={tenorRef}
                value={tenor}
                onChange={(event) => {
                  setTenor(event.target.value);
                  setErrors((current) => ({ ...current, tenor: "" }));
                }}
                disabled={locked}
                required
                aria-invalid={errors.tenor ? true : undefined}
                aria-describedby={errors.tenor ? "tenor-error" : undefined}
                className="mt-1 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink disabled:bg-surface-muted disabled:text-muted"
              >
                <option value="">Pilih tenor</option>
                {TENORS.map((value) => (
                  <option key={value} value={value}>
                    {value} bulan
                  </option>
                ))}
              </select>
              {errors.tenor ? (
                <p id="tenor-error" className="mt-1 text-sm font-medium text-danger-ink">
                  {errors.tenor}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="dp" className="block text-sm font-semibold text-ink">
                DP (Rupiah)
              </label>
              <input
                id="dp"
                ref={dpRef}
                type="text"
                inputMode="numeric"
                value={dpText}
                onChange={(event) => {
                  setDpText(event.target.value);
                  setErrors((current) => ({ ...current, dp: "" }));
                }}
                disabled={locked}
                placeholder="0"
                required
                aria-invalid={errors.dp ? true : undefined}
                aria-describedby={describedBy("dp-hint", errors.dp ? "dp-error" : undefined)}
                className="mt-1 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink disabled:bg-surface-muted disabled:text-muted"
              />
              <p id="dp-hint" className="mt-1 text-xs text-muted">
                {dpLimit !== null
                  ? `Maksimal ${formatRupiah(dpLimit)} untuk plafon ini.`
                  : "Maksimal 50% dari plafon."}
              </p>
              {errors.dp ? (
                <p id="dp-error" className="mt-1 text-sm font-medium text-danger-ink">
                  {errors.dp}
                </p>
              ) : null}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="tujuan" className="block text-sm font-semibold text-ink">
                Tujuan (opsional)
              </label>
              <input
                id="tujuan"
                ref={purposeRef}
                type="text"
                value={purpose}
                maxLength={120}
                onChange={(event) => {
                  setPurpose(event.target.value);
                  setErrors((current) => ({ ...current, purpose: "" }));
                }}
                disabled={locked}
                aria-invalid={errors.purpose ? true : undefined}
                aria-describedby={describedBy("tujuan-hint", errors.purpose ? "tujuan-error" : undefined)}
                className="mt-1 block min-h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink disabled:bg-surface-muted disabled:text-muted"
              />
              <p id="tujuan-hint" className="mt-1 text-xs text-muted">
                Maksimal 120 karakter.
              </p>
              {errors.purpose ? (
                <p id="tujuan-error" className="mt-1 text-sm font-medium text-danger-ink">
                  {errors.purpose}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section aria-labelledby="dokumen-title" className="rounded-panel border border-line bg-surface p-4">
          <h2 id="dokumen-title" className="text-base font-semibold text-ink">
            Dokumen
          </h2>
          <p className="mt-1 text-xs text-muted">
            JPG, PNG, atau PDF, maks 10 MB per dokumen. File tidak diunggah ke server, hanya namanya.
          </p>

          <div
            ref={uploadsRef}
            tabIndex={-1}
            aria-describedby={errors.documents ? "dokumen-error" : undefined}
            className="mt-3 grid gap-3 md:grid-cols-3"
          >
            {DOCUMENTS.map((document) => (
              <UploadSlot
                key={document.type}
                documentType={document.type}
                label={document.label}
                description="JPG, PNG, atau PDF, maks 10 MB."
                file={files[document.type]}
                disabled={locked || extracting}
                onFileChange={(file) => {
                  setFiles((current) => ({ ...current, [document.type]: file }));
                  setErrors((current) => ({ ...current, documents: "" }));
                }}
              />
            ))}
          </div>

          {errors.documents ? (
            <p id="dokumen-error" className="mt-2 text-sm font-medium text-danger-ink">
              {errors.documents}
            </p>
          ) : null}

          {application ? (
            <p className="mt-3 text-sm font-medium text-accent">
              Ekstraksi selesai. Form dikunci karena aplikasi {application.id} sudah tersimpan.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!allFilesReady || extracting || profiles === null}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-accent px-4 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:bg-surface-muted disabled:text-muted"
              >
                {extracting ? (
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 animate-spin rounded-full border-2 border-accent-ink border-t-transparent"
                  />
                ) : null}
                {extracting
                  ? "Mengekstrak dokumen..."
                  : createdId
                    ? "Coba Ekstrak Lagi"
                    : "Ekstrak Dokumen"}
              </button>
              {createdId ? (
                <p className="text-xs text-muted">
                  Aplikasi {createdId} sudah tersimpan. Ekstraksi dapat dicoba lagi tanpa membuat
                  aplikasi baru.
                </p>
              ) : !allFilesReady ? (
                <p className="text-xs text-muted">Unggah ketiga dokumen untuk mengaktifkan tombol.</p>
              ) : null}
            </div>
          )}

          <div aria-live="polite" className="sr-only">
            {extracting ? <p>Mengekstrak dokumen...</p> : null}
          </div>
        </section>

        {formError ? (
          <div role="alert" className="rounded-card border border-danger-ink bg-danger-bg p-3">
            <p className="text-sm font-semibold text-danger-ink">{formError}</p>
          </div>
        ) : null}

        {application?.extraction ? (
          <section aria-labelledby="ekstraksi-title" className="rounded-panel border border-line bg-surface p-4">
            <h2 id="ekstraksi-title" className="text-base font-semibold text-ink">
              Hasil ekstraksi
            </h2>
            <p className="mt-1 text-xs text-muted">
              Periksa nilai dan confidence. Koreksi THP, inflow, atau cicilan sebelum menghitung skor.
            </p>

            <div className="mt-3">
              <ExtractionList
                extraction={application.extraction}
                canEdit={!calculating}
                pending={pending}
                onSaveCorrection={handleSavePending}
                errors={correctionErrors}
                disabled={calculating}
              />
            </div>

            <button
              type="button"
              onClick={() => void handleScore()}
              disabled={calculating}
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-control bg-accent px-4 text-sm font-semibold text-accent-ink hover:bg-accent/90 disabled:bg-surface-muted disabled:text-muted sm:w-auto"
            >
              {calculating ? "Menghitung skor..." : "Hitung Skor"}
            </button>
            <p className="mt-2 text-xs text-muted">
              Koreksi yang tersimpan akan diterapkan sebelum skor dihitung ulang.
            </p>
          </section>
        ) : null}
      </form>
    </div>
  );
}
