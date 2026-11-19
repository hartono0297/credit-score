# QA

Cara menjalankan pengujian AI Credit Scoring Assistant. Hasil run terakhir ada di [qa-report.md](qa-report.md), dan daftar skenario beserta statusnya ada di [test-scenarios.md](test-scenarios.md).

## Persiapan

- Node.js 20.9 atau lebih baru.
- Google Chrome terpasang. E2E memakai Chrome di mesin (`channel: chrome`), bukan browser bawaan Playwright.
- Dependency sudah terpasang:

```bash
cd 02_source
npm install
```

## Jalankan semua sekaligus

```bash
cd 02_source
npm run qa
```

`npm run qa` menjalankan enam langkah berurutan dan berhenti di langkah pertama yang gagal. Total sekitar 2 menit pada mesin dengan beban normal.

| Urutan | Perintah | Yang dicek |
|---|---|---|
| 1 | `npm run verify` | Skor lima profil 1000 / 745 / 615 / 525 / 215 dan C-05 memicu GR-01 serta GR-02 |
| 2 | `npm run test:unit` | 22 unit test scoring, ekstraksi, dan format Rupiah |
| 3 | `npm run typecheck` | Tipe TypeScript |
| 4 | `npm run lint` | ESLint |
| 5 | `npm run build` | Build produksi Next.js |
| 6 | `npm run test:e2e` | 14 test E2E Playwright di browser |

Setiap perintah juga bisa dijalankan sendiri dari `02_source`.

## Catatan E2E

- Playwright menyalakan dev server sendiri di port 3108. Tidak perlu `npm run dev`, tetapi port 3108 harus kosong.
- Data demo dikembalikan ke seed sebelum setiap test, jadi perubahan di `data/db.json` hilang.
- Jalankan saat mesin tidak sibuk. Pada CPU 100 persen beberapa test pernah melewati batas waktu (riwayat di `qa-report.md` bagian 5).
- Artefak test yang gagal (trace dan screenshot) ditulis ke `automated/test-results/` dan tidak di-commit.
- Menjalankan satu test berdasarkan nama:

```bash
npx playwright test --config ../03_qa/automated/playwright.config.ts -g "SC-03"
```

## Isi folder

| Path | Isi |
|---|---|
| `test-scenarios.md` | Skenario function, performance, penetration terbatas, dan negative case, dengan status dan bukti |
| `qa-report.md` | Hasil run, temuan dan perbaikan, checklist keamanan, review anti-slop, batasan |
| `automated/unit/` | Unit test (Node test runner lewat `tsx`) |
| `automated/e2e/demo-flow.spec.ts` | 14 test E2E |
| `automated/playwright.config.ts` | Konfigurasi Playwright |

## Yang masih dicek manual

Beberapa skenario tidak tercakup test otomatis, misalnya navigasi keyboard dengan Escape (FT-23) dan install PWA. PWA hanya aktif di build produksi:

```bash
cd 02_source
npm run build
npm run start
```

Buka `http://localhost:3000`, lalu pilih install dari menu browser.
