# AI Credit Scoring Assistant (Demo)

Aplikasi web demo untuk credit analyst BNPL: queue aplikasi, ekstraksi dokumen simulasi, skor kredit, guardrail, dan keputusan analyst. Seluruh data sintetis.

Dokumen sumber ada di `../01_documents/`. Kontrak data runtime ada di `schema.md`.

## Prasyarat

- Node.js 20.9 atau lebih baru (diuji pada Node 22.14.0).
- npm.

## Menjalankan

```bash
cd 02_source
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Jalankan server lokal. |
| `npm run build` | Build server Next.js. |
| `npm run start` | Jalankan hasil build. |
| `npm run verify` | Verifikasi skor lima profil dan guardrail C-05. |
| `npm run test:unit` | Unit test scoring dan ekstraksi lewat Node test runner. |
| `npm run test:e2e` | E2E Playwright pada port 3108 memakai Chrome terpasang. |
| `npm run typecheck` | Typecheck TypeScript tanpa emit. |
| `npm run lint` | ESLint. |
| `npm run qa` | Semua cek di atas berurutan: verify, unit, typecheck, lint, build, E2E. Detail di `../03_qa/README.md`. |

## Data demo

- Seed lima profil ada di `lib/seed.ts`: C-01 sampai C-05.
- Penyimpanan runtime: `data/db.json`, dibuat otomatis saat pertama diakses.
- File `data/db.json` tidak di-commit. Hapus file tersebut untuk kembali ke seed.
- Skor wajib: `1000`, `745`, `615`, `525`, `215` (grade A sampai E).

## Struktur modul

| Path | Isi |
|---|---|
| `lib/types.ts` | Tipe domain sesuai TRD §6 dan §8. |
| `lib/scoring.ts` | Scorecard aditif, guardrail, faktor, narasi. Murni tanpa I/O. |
| `lib/extraction.ts` | Ekstraksi simulasi, nilai efektif, `ScoreInput`. |
| `lib/seed.ts` | Lima profil dan lima aplikasi awal. |
| `lib/validation.ts` | Validasi form, keputusan, dan upload. |
| `lib/format.ts` | Format Rupiah, persen, skor, dan waktu. |
| `lib/api-client.ts` | Pemanggil API lokal untuk komponen client. |
| `lib/server/store.ts` | Baca/tulis JSON server dengan tulis atomik dan antrean mutasi. |
| `lib/server/http.ts` | Helper respons error JSON untuk route handler. |
| `scripts/verify-scores.ts` | Pemeriksaan skor dan invariant seed. |

## Catatan

- Backend memakai route handler Next.js dan file JSON. Tidak ada database eksternal, autentikasi, atau layanan eksternal.
- Scoring deterministik: input sama menghasilkan skor sama.
- Skenario uji dan hasil QA ada di `../03_qa/`. Presentasi demo ada di `../04_presentation/presentation.pptx`.
