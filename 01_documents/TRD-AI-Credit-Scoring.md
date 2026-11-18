# Technical Requirements Document (TRD)
## AI Credit Scoring Assistant — Demo

| Item | Keterangan |
|---|---|
| Versi | 0.3 |
| Tanggal | 17 November 2026 |
| Status | Draft untuk implementasi |
| Mengacu pada | PRD v0.4, BRD v0.5 |
| Target | Demo lokal (server Next.js), PWA installable |

### Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 0.1 | 16-11-2026 | Draft awal |
| 0.2 | 16-11-2026 | Selaraskan rujukan dokumen, model SLIK, dan gap slip-mutasi efektif; catat status versi paket |
| 0.3 | 17-11-2026 | Backend minimal (route handlers + file JSON), PWA, struktur submission 01-04, QA otomatis |

---

## 1. Tujuan Teknis

Membangun demo yang:

1. Jalan dengan satu perintah (`npm run dev`).
2. Backend minimal di aplikasi yang sama; tanpa database eksternal atau layanan eksternal.
3. Deterministik: input sama → skor sama.
4. Dapat dijalankan lokal sebagai server Next.js dan di-install sebagai PWA.
5. Cukup kecil untuk diselesaikan dalam 2–3 hari.

---

## 2. Arsitektur

```
Browser (Next.js App Router + PWA)
├── App Router pages (client components)
│   ├── /                     Queue
│   ├── /new                  Aplikasi Baru
│   └── /application?id=...   Detail
├── fetch ke API lokal
└── PWA (manifest + service worker)

Next.js server (lokal)
├── Route handlers /api/*
│   ├── applications          list, create
│   ├── applications/[id]     detail
│   ├── extract               ekstraksi simulasi
│   ├── extraction            simpan koreksi + hitung ulang
│   ├── decision              simpan keputusan + log
│   ├── profiles              seed profil + SLIK
│   └── reset                 seed ulang
├── Store server
│   └── data/db.json          persistensi file JSON
└── Pure modules
    ├── scoring.ts            scorecard aditif
    ├── extraction.ts         hasil ekstraksi simulasi
    ├── seed.ts               5 profil + aplikasi awal
    └── format.ts             Rupiah, persen, tanggal
```

Tidak ada database eksternal, autentikasi, atau panggilan jaringan eksternal saat runtime. Klien hanya memanggil API lokal aplikasi.

---

## 3. Keputusan Teknis

| Keputusan | Alasan |
|---|---|
| Backend minimal di Next.js (route handlers) | Submission meminta backend source; tetap satu aplikasi dan tanpa service terpisah |
| File JSON sebagai persistensi server | Data bertahan saat refresh; tanpa database dan tanpa dependensi native |
| Scoring sebagai fungsi murni TypeScript | Deterministik, mudah diverifikasi, tanpa ML library |
| Mode server lokal (`next dev`/`next start`), tanpa static export | Route handler membutuhkan server; demo berjalan lokal |
| Tailwind CSS | Kecepatan membangun UI tanpa design system eksternal |
| Tanpa state library | Fetch per halaman + `useState` cukup untuk tiga layar |
| Tanpa zod/react-hook-form | Validasi 6 field ditulis manual |
| Tanpa chart library | Bar faktor memakai `div` dengan lebar proporsional |
| Tanpa icon library | Ikon minimal inline SVG bila perlu |
| PWA manual (manifest + service worker) | Installable tanpa dependensi `next-pwa` |
| Unit test Node test runner + E2E Playwright | Memenuhi QA otomatis; dev dependency disetujui |

---

## 4. Stack & Dependensi

| Kategori | Pilihan |
|---|---|
| Framework | Next.js (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Next.js route handlers |
| Persistensi | File JSON di `02_source/data/db.json` |
| PWA | Manifest + service worker manual |
| Dev tool | `tsx` (skrip verifikasi/unit test) |
| QA | Node test runner + `@playwright/test` |
| Node | ≥ 20 (lingkungan saat ini: 24) |

Tidak ada dependensi UI, chart, tanggal, atau validasi tambahan. Versi paket dikunci saat scaffold dan mengikuti `create-next-app` terbaru.

---

## 5. Struktur Proyek

```
01_documents/
  BRD-AI-Credit-Scoring.md
  PRD-AI-Credit-Scoring.md
  TRD-AI-Credit-Scoring.md
  Testing-Plan-AI-Credit-Scoring.md
  DESIGN.md
  mockups/

02_source/
  package.json
  next.config.ts
  tsconfig.json
  postcss.config.mjs
  schema.md                  kontrak data JSON + invariant
  data/                      db.json (runtime, seed bila kosong)
  public/
    manifest.webmanifest
    sw.js
    icons/
  app/
    layout.tsx               root layout + demo banner
    page.tsx                 Queue
    new/page.tsx             Form aplikasi baru
    application/page.tsx     Detail (client, baca ?id=)
    manifest.ts              metadata manifest
    globals.css              token + Tailwind
    api/
      applications/route.ts
      applications/[id]/route.ts
      applications/[id]/extract/route.ts
      applications/[id]/extraction/route.ts
      applications/[id]/decision/route.ts
      profiles/route.ts
      reset/route.ts
  components/
    app-header.tsx
    demo-banner.tsx
    queue-table.tsx
    score-badge.tsx
    status-badge.tsx
    confidence-chip.tsx
    factor-bar.tsx
    guardrail-banner.tsx
    upload-slot.tsx
    extraction-list.tsx
    slik-table.tsx
    decision-form.tsx
    decision-log.tsx
    empty-state.tsx
    pwa-register.tsx
  lib/
    types.ts
    seed.ts
    extraction.ts
    scoring.ts
    format.ts
    validation.ts
    server/store.ts
    api-client.ts
  scripts/
    verify-scores.ts

03_qa/
  test-scenarios.md
  qa-report.md
  automated/
    unit/
      scoring.test.ts
      extraction.test.ts
    e2e/
      demo-flow.spec.ts
    playwright.config.ts

04_presentation/
  presentation.pptx
```

---

## 6. Model Data

```ts
type Status = 'Draft' | 'Scored' | 'Manual Review' | 'Approved' | 'Rejected';
type ReasonCode =
  | 'INCOME_INSUFFICIENT' | 'DTI_EXCEEDED' | 'DELINQUENCY'
  | 'THIN_FILE' | 'DOC_MISMATCH' | 'OTHER';

type Profile = {
  id: string;                    // C-01..C-05
  name: string;
  nik: string;                   // sintetis
  birthDate: string;
  employer: string;
  thp: number;
  tenureMonths: number;
  incomeCv: number;              // 0..1
  salaryGap: number;             // 0..1
  existingInstallment: number;
  avgBalance: number;
  monthlyInflow: number;
  slik: SlikFacility[];
  worstKolektibilitas: number;   // 1..5
  lateCount: number;             // 1-90 hari, 12 bulan
  has90Plus: boolean;
};

type SlikFacility = {
  lender: string;
  jenis: string;
  plafon: number;
  bakiDebet: number;
  kolektibilitas: number;
};

type ExtractedField<T> = { value: T; confidence: number; edited?: boolean };

type Extraction = {
  ktp: { nama: ExtractedField<string>; nik: ExtractedField<string>; tanggalLahir: ExtractedField<string> };
  slipGaji: { employer: ExtractedField<string>; thp: ExtractedField<number>; masaKerjaBulan: ExtractedField<number> };
  mutasi: {
    rataRataSaldo: ExtractedField<number>;
    inflowBulanan: ExtractedField<number>;
    cicilanTerdeteksi: ExtractedField<number>;
  };
};

type Application = {
  id: string;                    // APP-001...
  profileId: string;
  customerName: string;
  product: 'BNPL';
  plafon: number;
  tenor: number;
  dp: number;
  purpose?: string;
  status: Status;
  documents: { type: 'KTP' | 'SLIP_GAJI' | 'MUTASI'; fileName: string }[];
  extraction?: Extraction;
  score?: ScoreResult;
  log: DecisionLog[];
};

type DecisionLog = {
  timestamp: string;
  applicationId: string;
  decision: 'Approved' | 'Rejected';
  reasonCode: ReasonCode;
  notes?: string;
  activeGuardrails: string[];
};
```

`ScoreResult` didefinisikan di bagian 8.

SLIK disimpan di `Profile.slik`; `Application` hanya menyimpan `profileId` dan menampilkan SLIK dari profil. `salaryGap` pada profil adalah nilai seed; saat skor dihitung, gunakan gap efektif dari THP dan inflow efektif (lihat §9).

---

## 7. State & Persistensi

```ts
type StoreState = {
  version: 2;
  applications: Application[];
  nextId: number;
};
```

- File: `02_source/data/db.json` (dibuat otomatis saat pertama dijalankan).
- Saat baca: parse; jika kosong/rusak → seed. Tulis atomik (temp file + rename).
- Setiap mutasi API → tulis ulang file.
- Tombol Reset Demo → seed ulang file → redirect ke `/`.
- File upload tidak disimpan sebagai biner; hanya `fileName`. Preview memakai `URL.createObjectURL` selama sesi dan di-revoke saat unmount. Setelah reload, preview tidak tersedia (nama file tetap tampil).
- Halaman client memakai loading placeholder sampai fetch API selesai; tidak ada mismatch SSR karena data diambil di client.

API server (dipanggil dari client):

```ts
GET    /api/applications                    // list
POST   /api/applications                    // create → { id }
GET    /api/applications/:id                // detail + profil/SLIK
POST   /api/applications/:id/extract        // delay 1.5s → extraction
PATCH  /api/applications/:id/extraction     // simpan koreksi → hitung ulang → application
POST   /api/applications/:id/decision       // update status, append log
GET    /api/profiles                        // seed profil untuk form
POST   /api/reset                           // seed ulang
```

---

## 8. Scoring Engine

### 8.1 API

```ts
type ScoreInput = {
  plafon: number;
  tenor: number;
  thp: number;
  existingInstallment: number;
  incomeCv: number;
  salaryGap: number;
  worstKolektibilitas: number;
  lateCount: number;
  has90Plus: boolean;
};

type Factor = {
  key: string;
  label: string;
  points: number;
  direction: 'positive' | 'negative' | 'neutral';
  detail: string;
};

type ScoreResult = {
  score: number;              // 0..1000
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  dti: number;                // rasio
  newInstallment: number;
  recommendation: string;
  factors: Factor[];          // 5 teratas berdasarkan |points|
  allFactors: Factor[];
  guardrails: { id: string; label: string }[];
  narrative: string;
};

scoreApplication(input: ScoreInput): ScoreResult
```

### 8.2 Algoritma

1. Hitung cicilan baru: `plafon * (1 + 0.02 * tenor) / tenor`.
2. Hitung DTI: `(cicilanBaru + cicilanExisting) / thp`.
3. Hitung rasio existing: `cicilanExisting / thp`.
4. Petakan setiap fitur ke poin sesuai tabel PRD §12.2.
5. `score = clamp(520 + sum(points), 0, 1000)`.
6. Tentukan grade dan rekomendasi sesuai PRD §12.3.
7. Evaluasi guardrail GR-01 s/d GR-03.
8. Ambil 5 faktor dengan `|points|` terbesar; urutkan positif lalu negatif.
9. Susun narasi dari grade, dua faktor dominan, dan rekomendasi.

Semua nilai bulat untuk skor; DTI dan persentase disimpan sebagai desimal, diformat saat render.

### 8.3 Determinisme

- Tanpa `Math.random`, tanpa waktu, tanpa I/O.
- Input sama → output identik.
- Diverifikasi oleh `scripts/verify-scores.ts` untuk kelima profil:

| Profil | Skor | Grade |
|---|---|---|
| C-01 | 1000 | A |
| C-02 | 745 | B |
| C-03 | 615 | C |
| C-04 | 525 | D |
| C-05 | 215 | E |

C-05 wajib menghasilkan guardrail GR-01 dan GR-02.

### 8.4 Narasi

Template:

`Skor {score} (Grade {grade}). {faktorPositif} menaikkan skor (+{poin}), namun {faktorNegatif} menahannya. Rekomendasi: {recommendation}.`

Jika tidak ada faktor negatif, gunakan kalimat positif saja.

---

## 9. Ekstraksi Simulasi

`extractFromProfile(profile: Profile): Extraction`

- Nilai diambil dari profil demo terpilih.
- Nilai yang dikoreksi analyst menggantikan nilai profil saat skor dihitung ulang: `thp`, `cicilanTerdeteksi`, dan `inflowBulanan`. Data `incomeCv`, kolektibilitas, dan keterlambatan tetap berasal dari profil/SLIK.
- Nilai efektif: `thpEfektif`, `cicilanEfektif`, dan `inflowEfektif` memakai nilai koreksi bila ada, jika tidak memakai profil. `salaryGapEfektif = abs(thpEfektif − inflowEfektif) / thpEfektif` dan nilai inilah yang masuk ke `scoreApplication`. Field yang dikoreksi diberi `edited: true`. Field ekstraksi lain dapat diedit untuk kelengkapan tampilan, tetapi hanya `thp`, `cicilanTerdeteksi`, dan `inflowBulanan` yang memengaruhi skor.
- Confidence statis per field (0,78–0,97), ditentukan di seed agar satu field selalu di bawah 0,80 untuk demo koreksi.
- UI menampilkan state loading selama route handler menunda 1.500 ms sebelum mengembalikan hasil.
- Tidak membaca isi file.

---

## 10. Routing & Halaman

| Route | Render | Catatan |
|---|---|---|
| `/` | Client | Queue + ringkasan + reset |
| `/new` | Client | Form + upload + ekstraksi |
| `/application?id=APP-003` | Client | Detail; `useSearchParams` dibungkus `<Suspense>` |

- ID tidak ditemukan → `EmptyState` dengan tautan kembali ke queue.
- Navigasi memakai `useRouter` dari `next/navigation`.
- Static export kompatibel karena ID dibaca dari query string, bukan segmen dinamis.

---

## 11. Komponen

| Komponen | Tanggung jawab |
|---|---|
| `AppHeader` | Judul, label demo, reset, navigasi |
| `QueueTable` | Tabel desktop / kartu mobile |
| `ScoreBadge` | Skor + grade, teks selalu ada |
| `StatusBadge` | Status aplikasi |
| `ConfidenceChip` | Persen + penanda < 80% |
| `FactorBar` | Bar +/− dengan poin dan label |
| `GuardrailBanner` | Daftar aturan yang terpicu |
| `UploadSlot` | Input file, validasi, nama file, preview |
| `ExtractionList` | Field + confidence + input koreksi |
| `SlikTable` | Fasilitas dan kolektibilitas |
| `DecisionForm` | Approve/Reject, reason code, catatan |
| `DecisionLog` | Riwayat keputusan aplikasi |
| `EmptyState` | Kondisi kosong/error |

Komponen interaktif diberi `'use client'`; komponen presentasional tetap murni.

---

## 12. Validasi & Error Handling

- Validasi hanya di batas input: form aplikasi, upload, keputusan.
- Form: plafon 5–50 juta, tenor ∈ {3,6,12,18,24}, DP 0–50% plafon, profil wajib.
- Upload: JPG/PNG/PDF, maks 10 MB; pesan error per slot.
- Keputusan: reason code wajib; catatan wajib jika guardrail aktif.
- File JSON server: `try/catch` saat parse; gagal → seed (satu-satunya fallback).
- API gagal/timeout: tampilkan pesan error di layar, jangan ubah data lokal.
- Tidak ada retry/telemetry/error boundary kompleks; cukup error state di UI.
- Pesan error berbahasa Indonesia, tanpa stack trace.

---

## 13. Styling

- Tailwind utility + CSS variables di `globals.css`.
- `DESIGN.md` adalah sumber arah visual; TRD hanya menetapkan token awal:

```css
--bg: #f6f6f4;      --surface: #ffffff;
--ink: #1a1b1d;     --muted: #5c6066;
--line: #e2e2df;    --accent: #0e5b58;
--grade-a: #13743a; --grade-b: #3f7d20; --grade-c: #9a6a00;
--grade-d: #b4540a; --grade-e: #a12622;
```

- Angka memakai `font-variant-numeric: tabular-nums`.
- Tanpa gradient, glass, shadow berlebihan, atau ilustrasi dekoratif.
- Satu font stack sistem (tanpa unduhan font eksternal).
- Kontras minimum WCAG AA.

---

## 14. Aksesibilitas

- Semua input memiliki `<label>` eksplisit.
- Error terhubung via `aria-describedby`; fokus pindah ke error pertama saat submit gagal.
- Grade dan status selalu disertai teks, tidak hanya warna.
- Bar faktor memiliki `aria-label` berisi nama dan poin.
- Target sentuh ≥ 44px pada mobile.
- `aria-live="polite"` untuk hasil ekstraksi dan pesan validasi.

---

## 15. Performa

- Tanpa gambar, font eksternal, atau library berat.
- Scoring sinkron < 1 ms.
- Ekstraksi simulasi 1,5 detik (disengaja).
- Target first load JS wajar (< 200 KB gzip) — bukan SLA, cukup untuk demo.
- Tidak ada prefetch agresif atau optimasi prematur.

---

## 16. Keamanan & Privasi

- Tidak ada panggilan jaringan eksternal saat runtime; klien hanya memanggil API lokal.
- File tidak diunggah ke mana pun; hanya object URL lokal.
- Data sintetis; NIK dan nama fiktif.
- Tidak ada `dangerouslySetInnerHTML`.
- Tidak ada secret/API key.
- File JSON server menyimpan data demo; dihapus lewat Reset Demo.
- Service worker hanya meng-cache aset statis; response API tidak di-cache.

---

## 17. Build, Run, Deploy

```bash
cd 02_source
npm install
npm run dev        # http://localhost:3000
npm run verify     # verifikasi skor 5 profil
npm run test:unit  # unit test
npm run test:e2e   # E2E Playwright
npm run build      # build server
npm run start      # jalankan hasil build
```

`next.config.ts` tidak memakai `output: 'export'`. Deploy demo: jalankan server lokal.

### 17.1 PWA

- `app/manifest.ts` menghasilkan manifest (nama, warna, ikon 192/512, `display: standalone`, `start_url: /`).
- `public/sw.js` meng-cache aset statis (shell); response `/api/*` tidak di-cache.
- `components/pwa-register.tsx` mendaftarkan service worker di client setelah mount.
- Ikon disimpan di `public/icons/`; tanpa library tambahan.

---

## 18. Verifikasi

### 18.1 Otomatis

`02_source/scripts/verify-scores.ts`:

- Menjalankan `scoreApplication` untuk kelima profil seed.
- Assert skor `[1000, 745, 615, 525, 215]` dan grade `A–E`.
- Assert C-05 memuat GR-01 dan GR-02.
- Exit code non-zero jika gagal.

`03_qa/automated/`:

- Unit test: scoring (skor, grade, guardrail, faktor) dan ekstraksi (confidence, koreksi efektif).
- E2E Playwright: queue → aplikasi baru → ekstraksi → koreksi → skor → keputusan → log → reset.
- Hasil dan defect dicatat di `03_qa/qa-report.md`.

### 18.2 Manual (checklist demo)

- [ ] Queue menampilkan 5 aplikasi.
- [ ] Aplikasi baru: upload 3 file → ekstraksi tampil + confidence.
- [ ] Field < 0,80 dapat dikoreksi dan memengaruhi skor (via input ulang).
- [ ] Detail menampilkan skor, narasi, 5 faktor, SLIK.
- [ ] C-05 menampilkan dua guardrail dan status Manual Review.
- [ ] Approve/Reject tersimpan dan muncul di log.
- [ ] Reason code wajib.
- [ ] Reset Demo mengembalikan seed.
- [ ] Data bertahan setelah refresh (file JSON server).
- [ ] PWA dapat di-install dari browser.
- [ ] Layout 390px, 768px, 1440px tanpa horizontal scroll.
- [ ] Tidak ada error di console.

---

## 19. Risiko Teknis

| Risiko | Mitigasi |
|---|---|
| File JSON rusak atau ditulis bersamaan | Tulis atomik + antrean mutasi in-process; fallback seed |
| Preview file hilang setelah reload | Nama file tetap tampil; preview hanya selama sesi |
| Query param butuh Suspense | Bungkus `useSearchParams` di `<Suspense>` |
| Perbedaan Tailwind v4 vs v3 | Ikuti setup `create-next-app`; jangan campur konfigurasi |
| PWA tidak dianggap "mobile app" oleh penilai | Catat interpretasi di QA report dan presentasi |
| Browser Playwright gagal diunduh | Unit test tetap berjalan; E2E manual didokumentasikan |
| Data demo dianggap nyata | Banner permanen + data fiktif |
| Scope melebar | Tidak ada DB/OCR/ML; perubahan scope harus mengubah PRD |

---

## 20. Di Luar Cakupan Teknis

- Database eksternal, autentikasi, RBAC.
- OCR/IDP, integrasi SLIK/LOS, webhook.
- Mobile native, offline mode.
- CI/CD, monitoring produksi.
- Analitik, feature flag, i18n multi-bahasa.

---

## Lampiran — Contoh db.json

```json
{
  "version": 2,
  "nextId": 6,
  "applications": [
    {
      "id": "APP-001",
      "profileId": "C-01",
      "customerName": "Andi Pratama",
      "product": "BNPL",
      "plafon": 20000000,
      "tenor": 12,
      "dp": 2000000,
      "status": "Approved",
      "documents": [
        { "type": "KTP", "fileName": "ktp-c01.jpg" },
        { "type": "SLIP_GAJI", "fileName": "slip-c01.pdf" },
        { "type": "MUTASI", "fileName": "mutasi-c01.pdf" }
      ],
      "log": [
        {
          "timestamp": "2026-11-16T08:00:00.000Z",
          "applicationId": "APP-001",
          "decision": "Approved",
          "reasonCode": "OTHER",
          "notes": "SLIK lancar dan DTI di bawah 20%. Disetujui sesuai pengajuan.",
          "activeGuardrails": []
        }
      ]
    }
  ]
}
```

Contoh ini dipersingkat; `score` dan `extraction` tidak ditampilkan.
