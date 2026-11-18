# QA Report
## AI Credit Scoring Assistant

| Item | Keterangan |
|---|---|
| Tanggal | 18 November 2026 |
| Branch | `plan/04-qa` |
| Lingkup | Function, performance, penetration terbatas, anti-slop |
| Status akhir | Lulus dengan 1 temuan terbuka dan 4 batasan pengujian |

---

## 1. Hasil Ringkas

| Gate | Hasil |
|---|---|
| Verifikasi skor seed | Lulus, 1000 / 745 / 615 / 525 / 215, C-05 memicu GR-01 dan GR-02 |
| Unit test | 21 lulus, 0 gagal |
| E2E Playwright | 11 lulus, 0 gagal, 33,1 detik |
| Typecheck | Lulus |
| Lint | Lulus |
| Build produksi | Lulus, 12 route |
| Audit dependency | 14 high dev-only, 0 critical, 0 pada dependency runtime |
| Anti-slop | 6 PASS |

Tidak ada perubahan pada perilaku aplikasi, scoring, seed, API, atau UI. Seluruh perubahan sesi ini berada di `03_qa/`, `02_source/package.json`, `02_source/package-lock.json`, dan `.gitignore`.

---

## 2. Lingkungan

| Item | Nilai |
|---|---|
| OS | Windows 11, build 10.0.26200 |
| Node | 22.14.0 |
| npm | 10.9.0 |
| Next.js | 16.4.6 |
| React | 19.3.0 |
| Tailwind CSS | 4.3.3 |
| TypeScript | 5.9.3 |
| Playwright | 1.65.1 |
| Browser | Chrome 156.0.8078.82 melalui `channel: chrome` |
| Port E2E | 3108 |
| Data | Seed 5 profil, reset sebelum setiap test |

Testing Plan menetapkan Node 24. Lingkungan aktual memakai Node 22.14.0. Semua gate lulus pada versi ini. Perbedaan dicatat dan tidak diubah karena merupakan versi Node mesin pengguna.

Context7 tidak tersedia di lingkungan ini. API Playwright dan Next.js mengikuti tipe paket terpasang dan dokumentasi resmi versi tersebut.

---

## 3. Perintah dan Hasil

| Perintah | Hasil |
|---|---|
| `cd 02_source && npm run verify` | OK, lima skor dan guardrail sesuai PRD 11.1 |
| `cd 02_source && npm run test:unit` | 21 pass, 0 fail |
| `cd 02_source && npm run test:e2e` | 11 pass, 0 fail, 33,1 detik |
| `cd 02_source && npx tsc --noEmit` | Lulus tanpa output |
| `cd 02_source && npm run lint` | Lulus tanpa output |
| `cd 02_source && npm run build` | Compiled in 2,3 detik, TypeScript 5,6 detik, 10 halaman statis |
| `npm audit --json` | 14 high, 0 critical |
| `npm audit --omit=dev --json` | 0 kerentanan |

Build menghasilkan route `/`, `/new`, `/application`, `/manifest.webmanifest`, dan tujuh route API.

---

## 4. Unit Test

File: `03_qa/automated/unit/scoring.test.ts` dan `03_qa/automated/unit/extraction.test.ts`.

Cakupan scoring:
- Skor dan grade lima seed, termasuk nilai tersimpan.
- Clamp 0 sampai 1000 pada input ekstrem.
- Top 5 faktor berdasarkan nilai absolut dan total kontribusi konsisten dengan skor.
- Guardrail C-05 serta GR-03.
- Ambang DTI, rasio cicilan, CV income, selisih slip-mutasi, kolektibilitas, dan keterlambatan.
- Determinisme lewat perbandingan hasil berulang.
- 1000 panggilan scoring di bawah 1 detik.

Cakupan ekstraksi:
- Confidence statis sembilan field.
- Ambang confidence rendah 0,8 dan field 0,78.
- Nilai dari profil dan fallback tanpa ekstraksi.
- Koreksi THP, cicilan, dan inflow memengaruhi nilai efektif serta gap.
- `buildScoreInput` memakai nilai efektif dan atribut profil.

---

## 5. E2E

File: `03_qa/automated/e2e/demo-flow.spec.ts`.

| Test | Cakupan |
|---|---|
| US-01 queue | Lima seed, ringkasan 5 / 1 / 1, tabel, buka detail APP-001 |
| SC-02 | Skor 215, GR-01, GR-02, reject tanpa reason, catatan wajib, log, ubah keputusan, koreksi nonaktif |
| SC-01 | C-02 745, approve, log, persistensi setelah reload, reset seed |
| US-02 | Validasi field kosong, plafon 4 juta dan 60 juta, file 10 MB + 1 byte |
| SC-03 | File `.txt`, tiga upload, ekstraksi, 78 persen, koreksi THP, skor 720, dokumen hanya menyimpan nama dan tipe |
| SC-04 | C-01 1000 A, lima faktor, approve, log |
| ID | APP-999 dan format salah |
| Viewport | 390, 768, 1440 pada queue, C-04, C-05, dan form baru |
| Console | Tidak ada error, tidak ada request eksternal |
| Performance | Muat queue 877 ms |
| Keamanan | Header, validasi API, 404, traversal |

---

## 6. Temuan dan Perbaikan

| ID | Temuan | Severity | Status | Tindakan |
|---|---|---|---|---|
| QD-01 | Tiga locator E2E ambigu: label Reason code juga cocok dengan aria-label tombol mobile, teks rekomendasi muncul dua kali, dan filter section mencakup parent | Low | Selesai | Locator dipertegas di test. Tidak ada perubahan aplikasi |
| QD-02 | Artefak Playwright awalnya ditulis ke `02_source/test-results` | Low | Selesai | `outputDir` dikunci ke `03_qa/automated/test-results`; entri gitignore ditambah |
| QD-03 | Satu run penuh mendapat 500 saat menyimpan keputusan C-05 tanpa catatan | Medium | Selesai | Reproduksi ulang pada integrasi: sisa `db.json.*.tmp` menandakan rename sementara gagal di Windows. Store sekarang mengulang rename hingga empat kali dengan jeda 20 sampai 160 ms dan menghapus temp file saat gagal permanen. Dua run penuh E2E lulus setelah perbaikan |
| QD-04 | Teks Approved dan chip confidence memakai `#157f3d` di atas `#e7f2ea`, rasio kontras 4,42:1 | Low | Selesai | Token `--grade-a` diganti `#13743a` di DESIGN.md, TRD, dan `globals.css`; rasio kontras menjadi 5,1:1 |
| QD-05 | `npm audit` melaporkan 14 high pada dependency dev transitif | Low | Diterima | Berasal dari toolchain ESLint dan `picomatch`. `npm audit --omit=dev` bersih. Tidak ada paparan runtime |

Catatan QD-03: gejala muncul lagi pada satu run integrasi setelah merge, dengan `db.json.21124.23.tmp` tertinggal. Perbaikan ada di `02_source/lib/server/store.ts`: rename diulang pada kode EPERM, EACCES, atau EBUSY, dan temp file dibersihkan bila upaya terakhir gagal. Diverifikasi dengan dua run E2E penuh tanpa kegagalan.

---

## 7. Checklist Keamanan

| Cek | Hasil | Bukti |
|---|---|---|
| Security headers | Lulus | E2E memeriksa `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` |
| Tidak ada jaringan eksternal | Lulus | E2E memantau request pada tiga halaman, hasil kosong |
| Tidak ada secret | Lulus | Pencarian `API_KEY`, `SECRET`, `NEXT_PUBLIC` tidak menemukan hasil |
| Tidak ada `dangerouslySetInnerHTML` | Lulus | Pencarian kode tidak menemukan hasil |
| Validasi input API | Lulus | Profil, plafon, tenor, DP, reason code, dan catatan guardrail menghasilkan 400 |
| ID dan path traversal | Lulus | APP-999 menghasilkan 404; `..%2F..%2Fpackage.json` tidak mengembalikan file aplikasi |
| `/api` tidak di-cache service worker | Lulus | `public/sw.js` mengembalikan lebih awal untuk path `/api/` |
| File upload tidak disimpan | Lulus | API hanya menerima `type` dan `fileName`; E2E memeriksa kunci dokumen |
| Pesan error tanpa detail internal | Lulus | Pesan 400/404/500 berupa kalimat Bahasa Indonesia |
| Dependency runtime | Lulus | `npm audit --omit=dev` melaporkan 0 kerentanan |

---

## 8. Review Anti-Slop

Mode: During. Skill yang dimuat: `antislop`, `antislop-code`, `antislop-copywriting`.

| Kategori | Status | Bukti |
|---|---|---|
| Layout | PASS | Tidak ada overflow horizontal pada 12 kombinasi halaman dan lebar. Queue berupa tabel di desktop dan kartu di 390px. Detail memakai grid 7/5 dan bertumpuk di mobile. Satu H1 per halaman |
| Tipografi | PASS | Font sistem, angka tabular, skor 48px, label form terlihat, tanpa uppercase lebar atau monospace dekoratif |
| Warna | PASS | Satu aksen teal, latar kertas, warna grade dan status selalu disertai teks, tanpa gradient, glow, atau glass |
| Interaksi | PASS | Target sentuh minimal 44px, focus ring 2px, disabled state jelas, transisi dibatasi, `prefers-reduced-motion` tersedia |
| Aksesibilitas | PASS | Kontras teks Approved dan chip confidence 5,1:1 setelah perubahan token. Traversal keyboard manual belum diuji |
| Kode | PASS | Tidak ada `console.log` di aplikasi, `debugger`, `any`, atau `dangerouslySetInnerHTML`. Scoring murni dan terpisah dari UI. Komentar hanya untuk invariants yang tidak jelas |

Bukti visual: tangkapan layar aktual pada 1440px dan 390px untuk queue dan detail C-05. Hasil review: hierarki angka, guardrail, dan keputusan terbaca; tidak ada dekorasi di luar DESIGN.md.

---

## 9. Batasan Pengujian

- Tidak ada perangkat mobile fisik. Mobile diuji pada viewport 390px di Chrome desktop.
- PWA install prompt tidak diuji karena service worker hanya aktif pada build produksi.
- Navigasi keyboard dan Escape belum diuji manual.
- Error state saat server dimatikan belum diuji.
- Lighthouse tidak dijalankan.
- PT-02 memakai rentang 1,3 sampai 10 detik, bukan toleransi ketat 1,5 plus minus 0,3 detik.
- Pengukuran performa memakai dev server di drive D dengan peringatan filesystem lambat.
- `npx tsc --noEmit` hanya memeriksa project `02_source`. File test di `03_qa/` tidak masuk `tsconfig` aplikasi; Playwright tetap menjalankan file tersebut dan gate E2E lulus.
- `db.json` tersisa dalam status seed. Penghapusan file diblokir pengaman lingkungan; file ini gitignored dan tidak masuk commit.

---

## 10. Exit Criteria

| Kriteria | Status |
|---|---|
| Semua FT prioritas Must lulus | Lulus, dengan FT-20, FT-23, dan FT-24 tidak diuji dan dicatat |
| Tidak ada defect Critical atau High terbuka | Lulus. QD-03 selesai pada integrasi; tidak ada defect Critical atau High terbuka |
| Unit, verify, dan E2E lulus | Lulus |
| Performance terukur atau ditandai | Lulus, PT-05 tidak diukur |
| Checklist keamanan terisi | Lulus |
| QA report memuat hasil, defect, dan batasan | Lulus |

---

## 11. Tindak Lanjut

1. Jalankan uji keyboard, error state server mati, dan install PWA pada build produksi sebelum demo eksternal.
2. Pertimbangkan upgrade toolchain ESLint untuk menutup temuan audit dev.
