# QA Report
## AI Credit Scoring Assistant

| Item | Keterangan |
|---|---|
| Tanggal | 19 November 2026 |
| Branch | `claude/redesign-v2-562ee4` (redesign DESIGN.md v2.0) |
| Lingkup | Verifikasi redesign UI v2.0: gate otomatis, cek browser terskrip, anti-slop |
| Status akhir | Gate statis lulus; E2E tidak hijau penuh dalam satu run akibat beban CPU mesin; anti-slop 3 kategori FAIL (rendah) menunggu keputusan pemilik |

---

## 1. Hasil Ringkas

| Gate | Hasil |
|---|---|
| Verifikasi skor seed | Lulus, 1000 / 745 / 615 / 525 / 215, C-05 memicu GR-01 dan GR-02 |
| Unit test | 22 lulus, 0 gagal |
| Typecheck | Lulus |
| Lint | Lulus |
| Build produksi | Lulus, 12 entri route |
| E2E Playwright | 14 test. Run penuh terbaik: 11 lulus, 3 gagal timeout. Run penuh terakhir: 9 lulus, 5 gagal. Semua kegagalan berupa timeout atau ambang waktu saat CPU mesin 100 persen oleh proses di luar proyek. Tiga test yang gagal pada run 2 lulus bila dijalankan terpisah. Tidak ada satu run penuh yang hijau. Lihat bagian 5 |
| Cek browser terskrip (390, 768, 1440) | 90 dari 120 cek lulus; 30 yang gagal adalah artefak pengukuran atau temuan kecil, diuraikan di bagian 8.4 |
| Audit dependency | Tidak dijalankan ulang pada sesi ini; hasil sebelumnya: 14 high dev-only, 0 pada dependency runtime |
| Anti-slop | Layout PASS, Warna PASS, Kode PASS; Tipografi, Interaksi, Aksesibilitas FAIL (rendah) |

Redesign v2.0 tidak mengubah scoring, seed, API, atau tipe data. Skor lima profil tetap 1000 / 745 / 615 / 525 / 215.

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
| `cd 02_source && npm run test:unit` | 22 pass, 0 fail |
| `cd 02_source && npm run lint` | Lulus, exit 0 |
| `cd 02_source && npx tsc --noEmit` | Lulus, exit 0 |
| `cd 02_source && npm run build` | Lulus: Compiled in 30,8 detik, TypeScript 33,4 detik, 10 halaman statis; route `/`, `/new`, `/application`, `/manifest.webmanifest`, `/_not-found`, dan tujuh route API |
| `cd 02_source && npm run test:e2e` | Lima percobaan, lihat bagian 5. Tidak ada run penuh hijau |

Beban CPU saat gate dijalankan: 100 persen (`Win32_Processor.LoadPercentage`, diukur sebelum E2E dan sesudahnya) dari proses Chrome di luar proyek ini. Proses itu tidak dihentikan.

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

File: `03_qa/automated/e2e/demo-flow.spec.ts` (14 test).

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

### Percobaan E2E pada sesi ini

Tidak ada ambang waktu atau timeout yang diubah. Dev server E2E di port 3108.

| Run | Hasil | Gagal | Pesan |
|---|---|---|---|
| 1 | Dihentikan paksa oleh pembungkus `timeout 590` buatan sesi ini setelah 12 dari 14 test. Tidak dihitung | Test 8 dan 11 gagal sebelum dihentikan; test 12 terputus | Test timeout 30 detik terlampaui (38,7 dan 39,0 detik) |
| 2 | 11 lulus, 3 gagal, 12,6 menit | header v2 (54,2 detik, kompilasi dingin), SC-03, horizontal scroll | `Test timeout of 30000ms exceeded`; SC-03: heading `Hasil ekstraksi` tidak muncul dalam 15 detik |
| 3 | Tidak berjalan: webServer tidak siap dalam 120 detik | Semua | `Timed out waiting 120000ms from config.webServer` |
| 4 | 3 dari 3 lulus (hanya test yang gagal pada run 2), 1,4 menit | Tidak ada | header v2 9,3 detik, SC-03 20,6 detik, horizontal scroll 15,5 detik |
| 5 | 9 lulus, 5 gagal, 16,9 menit | queue mobile, SC-02, SC-01, SC-03, waktu muat queue | timeout 30 detik; `Keputusan tersimpan.` tidak terlihat dalam 10 detik; heading `Hasil ekstraksi` tidak muncul; waktu muat queue melewati 3000 ms |

Himpunan test yang gagal berbeda di tiap run, dan test yang gagal pada satu run lulus pada run lain atau saat dijalankan terpisah. Waktu tempuh jauh di atas baseline sebelumnya (satu suite 33,1 detik pada v1 melawan 12,6 sampai 16,9 menit). Pola ini konsisten dengan beban CPU mesin, bukan regresi aplikasi, tetapi tidak dibuktikan: tidak ada run penuh pada mesin tenang. Run ulang penuh pada mesin tenang diperlukan sebelum demo.

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

## 8. Review Anti-Slop (Delivery Gate v2)

Mode: During. Skill yang dimuat: `antislop`, `antislop-ui`, `antislop-layoutmobile`, `antislop-code`, `antislop-human`. Design Read: alat kerja underwriting internal untuk credit analyst BNPL, bahasa visual minimalis putih, dial ENERGY 1 / RHYTHM 2 / MOTION 1 (DESIGN.md v2.0 bagian 1). Dokumen proyek menang atas skill bila bertentangan; penyimpangan dicatat.

Bukti berasal dari dua sumber: audit statis kode dan token (baca-saja, HEAD `bece996`) dan cek browser terskrip pada build produksi (`next start`, port 3109, Chrome 156, Playwright, skrip di luar repo).

### 8.1 Hasil per kategori

| Kategori | Status | Bukti utama |
|---|---|---|
| Layout | PASS | Tanpa scroll horizontal pada 390, 768, 1440 di queue, aplikasi baru (kosong, terunggah, terekstrak, terkoreksi), detail C-05, setelah keputusan, dan panel konfirmasi reset: `scrollWidth` sama dengan `clientWidth` pada semua pengukuran. Bagian tanpa panel di desktop dan kartu radius 14px di mobile (`application-detail.tsx:28`, token `--radius-card`). Grid detail 7/5 (`application-detail.tsx:232`). Panel konfirmasi reset 390px tidak menimpa konten (tangkapan layar). Satu H1 per halaman |
| Tipografi | FAIL (rendah) | Font Plus Jakarta Sans lokal dimuat dari `/_next/static/media/PlusJakartaSans_latin-s.p.1nsast9qgxif8.woff2`; `font-family` computed body `jakarta, "jakarta Fallback", ui-sans-serif, system-ui, ...` (nama keluarga hasil `next/font/local`). Tabular nums, skor 48/56px bobot 600. FAIL: line-height body `text-sm` 1,43 padahal DESIGN bagian 4 menetapkan 1,6; `leading-relaxed` hanya pada sebagian paragraf (`application-detail.tsx:266,271,336`, `empty-state.tsx:16`) |
| Warna | PASS | Hanya token; tidak ada hex mentah di komponen (selain `themeColor` di `app/layout.tsx:23` dan manifest). Tanpa gradient, glow, glass, atau shadow. Status, grade, dan confidence selalu disertai teks. Kontras di 8.2 |
| Interaksi | FAIL (rendah) | Fokus: pada tiga lebar semua elemen yang menerima Tab memakai `outline: solid 2px` (aksen), kecuali Tab yang keluar dari dokumen ke UI browser; radio card terfokus berlingkar 2px (`radio-focus-390.png`). Target sentuh: tombol, tautan, baris queue, Approve/Reject action bar (175x48), Simpan Keputusan (334x48 pada 390px) minimal 44px; `Reset Demo` 106x44. Reduced motion tersedia (`globals.css:122-129`). FAIL: queue kosong menampilkan dua tombol utama hitam sekaligus ("Aplikasi Baru" di header dan di `EmptyState`, `app/page.tsx:120-125`); tombol "Batal" disabled tanpa gaya disabled (`app-header.tsx:88-98`, `extraction-list.tsx:145-155`). Terukur: skip link "Langsung ke konten" saat fokus setinggi 36px (159x36), di bawah 44px |
| Aksesibilitas | FAIL (rendah) | Label terlihat di semua field, landmark lengkap, `lang="id"`, skip link, `role="img"` dengan `aria-label` pada skala skor, `scope` pada `th`. FAIL: border input `--line-strong` #d9d9d6 pada putih 1,41:1, di bawah 3:1 untuk kontras non-teks (nilai ditetapkan DESIGN bagian 3, jadi penyimpangan dicatat); grade C pada baris Manual Review 4,47:1 (laten, tidak terjangkau data demo). Catatan rendah: `<title>` statis di semua rute, `<dt>`/`<dd>` dua tingkat `div` di `extraction-list.tsx:86-93`, `aria-label` pada `span` di `score-badge.tsx:18` |
| Kode | PASS | Tanpa dependensi baru (`package.json` hanya mengubah skrip `test:unit`); tujuh komentar semuanya menjelaskan alasan; tanpa `console.log`, `dangerouslySetInnerHTML`, `outline-none`. Catatan: `GRADE_BANDS` di-export tetapi hanya dipakai di berkasnya (`score-scale.tsx:4`); pembungkus `div` tunggal di `app/page.tsx:78-85` |

Tiga FAIL bertingkat rendah dan tidak diperbaiki pada tugas ini. Keputusan perbaikan atau penerimaan ada pada pemilik proyek.

### 8.2 Kontras warna (rumus WCAG 2.x; pasangan yang gagal diverifikasi ulang dengan checker antislop)

| Pasangan | Rasio | Hasil |
|---|---|---|
| ink #17181a pada bg #ffffff | 17,77 | PASS |
| muted #5c6066 pada bg #ffffff | 6,33 | PASS |
| muted #5c6066 pada bg-mobile #f5f5f3 | 5,79 | PASS |
| warn-ink #6b4a00 pada warn-bg #fbf1d9 | 7,17 | PASS |
| danger-ink #8c1d18 pada danger-bg #fbe9e7 | 7,77 | PASS |
| info-ink #2d465e pada info-bg #e8eef4 | 8,36 | PASS |
| grade-a #13743a pada putih | 5,85 | PASS |
| grade-b #3f7d20 pada putih | 5,04 | PASS |
| grade-c #9a6a00 pada putih | 4,73 | PASS |
| grade-d #b4540a pada putih | 4,98 | PASS |
| grade-e #a12622 pada putih | 7,46 | PASS |
| accent #0e5b58 pada accent-soft #e3efed | 6,72 | PASS |
| putih pada ink (tombol utama) | 17,77 | PASS |
| grade-c #9a6a00 pada warn-row #fdf8ec | 4,47 | FAIL (laten) |
| line-strong #d9d9d6 pada putih (border input, non-teks 3:1) | 1,41 | FAIL |

### 8.3 Pola terlarang (grep `app/` dan `components/`)

| Pola | Jumlah |
|---|---|
| `console.log`, `dangerouslySetInnerHTML` | 0 |
| `shadow`, `gradient`, `backdrop` | 0 |
| `font-bold`, `font-extrabold`, `font-black` | 0 |
| Em dash dan tanda seru di copy UI | 0 (kecocokan `!` hanyalah operator JS) |
| Emoji | 0 (satu-satunya karakter non-ASCII adalah titik tengah di `decision-log.tsx:40`) |
| `outline-none`, `transition-all`, `font-mono`, `uppercase`, `border-l-*` | 0 |

### 8.4 Cek browser terskrip (R-35, bukan pengamatan mata manusia)

Skrip: build produksi, `POST /api/reset` sebelum tiap lebar. Alur per lebar: queue; aplikasi baru (ketik 15000000 di Plafon dan 1500000 di DP, unggah tiga file, ekstrak, koreksi THP, hitung skor 720); detail APP-005 dengan guardrail; simpan keputusan Reject dengan reason dan catatan; Reset Demo lewat UI. Hasil: 90 lulus, 30 gagal dari 120 cek.

| Cek | 390 | 768 | 1440 |
|---|---|---|---|
| Tanpa scroll horizontal (8 titik per lebar) | lulus | lulus | lulus |
| Pemisah ribuan saat mengetik (Plafon, DP, koreksi THP) | `15.000.000`, `1.500.000`, `12.000.000` | sama | sama |
| Alur baru sampai skor 720 dan guardrail C-05 terlihat | lulus | lulus | lulus |
| Keputusan tersimpan, reset kembali ke 5 aplikasi | lulus | lulus | lulus |
| Error console | 0 | 0 | 0 |
| Request font | hanya `/_next/static/media/...woff2` | sama | sama |
| Request eksternal | 0 (satu `blob:` lokal dari pratinjau unggahan) | sama | sama |
| Fokus Tab lewat header, baris queue, form, radio card, action bar | semua outline solid 2px | sama | sama |
| `Reset Demo` | 106x44 | 106x44 | 106x44 |

Penjelasan 30 cek yang ditandai gagal oleh skrip. Tidak satu pun regresi aplikasi; satu temuan kecil nyata (skip link) dicatat pada Interaksi.
- 3 kali "font-family": skrip mencari nama "Plus Jakarta Sans", sedangkan `next/font/local` menamai keluarga `jakarta`. File font yang dimuat benar.
- 21 kali "touch targets": semuanya memuat skip link yang tersembunyi sebelum fokus (1x1, desain `sr-only`; saat fokus 159x36, lihat Interaksi). Dua belas di antaranya juga memuat input file `sr-only` yang dioperasikan lewat tombol "Pilih file" (tombol itu tidak ditandai, jadi minimal 44px). Dua (768 dan 1440, detail C-05) juga memuat `summary` setinggi 21px; pada lebar `md` ke atas bagian dipaksa terbuka dan `summary` bukan kontrol interaktif (tidak ikut urutan Tab).
- 3 kali "Tab setelah radio": Tab keluar dari dokumen ke UI browser di akhir halaman.
- 3 kali "request eksternal": URL `blob:` lokal.

Yang TIDAK diperiksa mata manusia: seluruh bagian ini dijalankan lewat skrip. Tangkapan layar (queue, detail 390 dan 1440, fokus radio, konfirmasi reset) hanya dilihat oleh agen, bukan oleh manusia. Tidak ada pengujian pada perangkat sentuh nyata, zoom teks 200 persen, keyboard layar mobile, pembaca layar, atau mode kontras tinggi.

---

## 9. Batasan Pengujian

- Tidak ada perangkat mobile fisik. Mobile diuji pada viewport 390px di Chrome desktop.
- PWA install prompt tidak diuji karena service worker hanya aktif pada build produksi.
- Navigasi keyboard diuji lewat skrip Tab (bagian 8.4), bukan oleh manusia; Escape tidak diuji.
- Error state saat server dimatikan belum diuji.
- Lighthouse tidak dijalankan.
- PT-02 memakai rentang 1,3 sampai 10 detik, bukan toleransi ketat 1,5 plus minus 0,3 detik.
- Pengukuran performa memakai dev server di drive D dengan peringatan filesystem lambat.
- `npx tsc --noEmit` hanya memeriksa project `02_source`. File test di `03_qa/` tidak masuk `tsconfig` aplikasi; Playwright tetap menjalankan file tersebut dan gate E2E lulus.
- `db.json` tersisa dalam status seed. Penghapusan file diblokir pengaman lingkungan; file ini gitignored dan tidak masuk commit.
- Sesi verifikasi v2 dijalankan pada mesin dengan CPU 100 persen dari proses di luar proyek; E2E tidak mencapai run hijau penuh (bagian 5).
- `db.json` dikembalikan ke seed lewat `POST /api/reset` setelah cek terskrip dan diperiksa kembali sesudah E2E (`nextId` 6).

---

## 10. Exit Criteria

| Kriteria | Status |
|---|---|
| verify, unit, typecheck, lint, build lulus | Lulus |
| E2E lulus | Belum terbukti: run penuh tidak hijau akibat beban mesin, perlu diulang pada mesin tenang |
| Tidak ada defect Critical atau High terbuka | Lulus. Tiga FAIL anti-slop bertingkat rendah |
| Checklist keamanan terisi | Lulus (bagian 7, tidak diubah oleh redesign) |
| QA report memuat hasil, defect, dan batasan | Lulus |

---

## 11. Tindak Lanjut

1. Jalankan ulang `npm run test:e2e` penuh pada mesin tanpa beban dan perbarui bagian 1 dan 5.
2. Putuskan tiga FAIL anti-slop: border input 1,41:1 (gelapkan token atau catat penyimpangan DESIGN), line-height body 1,43 melawan 1,6, dan dua tombol utama pada queue kosong. Catatan rendah lain di 8.1.
3. Skip link saat fokus setinggi 36px; naikkan ke 44px bila target sentuh berlaku untuk elemen ini.
4. Pertimbangkan upgrade toolchain ESLint untuk menutup temuan audit dev.

### Temuan terbuka

- `04_presentation/presentation.pptx` masih memuat tangkapan layar v1 dan slide 6 menyebut guardrail muncul "di banner"; tidak dibangun ulang pada redesign ini.
- Narasi skor pada halaman detail tampil dua kali (sudah ada sebelumnya, di luar lingkup).
