# AGENTS.md — AI Credit Scoring Demo

Aturan kerja untuk agent yang mengerjakan proyek ini. Berlaku untuk semua sesi, termasuk subagent.

---

## 1. Konteks Proyek

Aplikasi web demo untuk **credit analyst BNPL**: queue aplikasi, upload dokumen (ekstraksi simulasi), SLIK simulasi, skor + faktor risiko, guardrail, dan keputusan analyst. Ini **demo singkat**, bukan produk produksi.

### Sumber kebenaran

| Dokumen | Peran |
|---|---|
| `01_documents/BRD-AI-Credit-Scoring.md` | Scope dan tujuan bisnis |
| `01_documents/PRD-AI-Credit-Scoring.md` | Perilaku produk, layar, scoring, data demo, mockup |
| `01_documents/TRD-AI-Credit-Scoring.md` | Arsitektur, tipe data, API, routing, build |
| `01_documents/Testing-Plan-AI-Credit-Scoring.md` | Rencana function, performance, dan penetration test |
| `01_documents/mockups/*.png` | Arah visual |
| `01_documents/DESIGN.md` | Token dan aturan visual final (wajib sebelum UI) |

Urutan baca sebelum coding: **BRD → PRD → TRD → Testing Plan → DESIGN.md**.

Jika dokumen bertentangan: perilaku produk mengikuti PRD, keputusan teknis mengikuti TRD, scope mengikuti BRD. Jika tetap ambigu, berhenti dan tanya — jangan menebak.

---

## 2. Non-Negotiables

1. **Backend minimal di dalam aplikasi yang sama**: Next.js route handlers + penyimpanan file JSON. Tanpa database eksternal, autentikasi, OCR, ML training, atau integrasi eksternal.
2. **Satu aplikasi Next.js** (App Router, TypeScript, Tailwind), mode server lokal. Tidak ada service terpisah dan tidak memakai static export.
3. **Data demo sintetis**: 5 profil, persistensi file JSON di server, tanpa PII nyata. PWA installable adalah representasi "mobile app".
4. **Scoring deterministik**: fungsi murni, tanpa `Math.random`, tanpa I/O, tanpa waktu.
5. **Skor kelima profil wajib**: `1000, 745, 615, 525, 215` (A–E), C-05 memicu dua guardrail.
6. **AI bersifat advisory**: keputusan akhir selalu oleh analyst dan tercatat.
7. **Label "Demo Mode: data simulasi"** terlihat di semua halaman.
8. **Tanpa dependensi baru** tanpa alasan kuat dan persetujuan pengguna. Yang disetujui: `@playwright/test` sebagai dev dependency untuk QA.
9. **Jangan memperluas scope.** Fitur di luar PRD tidak dikerjakan tanpa perubahan dokumen.
10. **Jangan pernah menghapus atau menimpa pekerjaan pengguna** yang tidak terkait tugas.
11. **UI dan kode wajib melewati anti-slop**: setiap perubahan UI memuat `antislop` + `antislop-ui`; setiap perubahan kode memuat `antislop` + `antislop-code`. Tanpa ini, pekerjaan belum dianggap selesai.
12. **Referensi library wajib Context7**: sebelum menulis kode yang memakai API library/framework, resolusi dokumentasi via Context7 (`resolve-library-id` → `query-docs`). Jangan mengandalkan ingatan model untuk API atau versi.

---

## 3. Orchestration

### 3.1 Peran

- **Main agent**: pemilik rencana, integrator, dan reviewer akhir. Bertanggung jawab atas hasil keseluruhan.
- **Subagent**: eksekutor tugas terbatas (riset, verifikasi, implementasi terisolasi). Tidak boleh mengambil keputusan arsitektur sendiri.

### 3.2 Aturan delegasi

- Delegasikan hanya pekerjaan yang **independen dan terdefinisi jelas**.
- Prompt subagent harus memuat: tujuan, file yang relevan, batasan, dan format hasil.
- **Jangan mendelegasikan pemahaman.** Jelaskan sendiri apa yang harus diubah dan mengapa.
- Setiap hasil subagent **wajib diverifikasi** main agent sebelum dilaporkan selesai.
- Jangan menanyakan hal yang sudah dijawab dokumen; baca dokumen terlebih dahulu.

### 3.3 Paralelisasi dan konflik

- Boleh paralel: riset, pembacaan file, pengecekan independen.
- **Satu penulis per file.** Jangan menjalankan dua agent yang mengedit file sama secara bersamaan.
- Urutan dependensi harus eksplisit: data → scoring → UI → review.
- Jika dua tugas menyentuh `02_source/lib/types.ts`, `02_source/lib/scoring.ts`, atau `01_documents/PRD`, kerjakan berurutan.

### 3.4 Batas keputusan

Agent boleh memutuskan: detail implementasi, nama komponen internal, urutan refactor kecil.
Agent **tidak boleh** memutuskan: perubahan scope, stack, model scoring, guardrail, data demo, atau dependensi baru — tanpa persetujuan pengguna.

---

## 4. Planning

### 4.1 Sebelum mulai

1. Baca dokumen sumber yang relevan.
2. Periksa kondisi workspace (`git status` bila ada, daftar file).
3. Identifikasi acceptance criteria yang akan dipenuhi.
4. Untuk pekerjaan yang menyentuh API library/framework, ambil dokumentasi versi terbaru via Context7.
5. Tentukan cara verifikasinya sebelum menulis kode.

### 4.2 Format rencana

Rencana minimal memuat:

- Tujuan satu kalimat.
- Langkah berurutan (maksimal 7 langkah besar).
- File yang dibuat/diubah.
- Acceptance criteria dan perintah verifikasi.
- Risiko atau asumsi yang belum jelas.

Untuk pekerjaan non-trivial (lebih dari ~3 file atau mengubah scoring/UI utama), gunakan plan mode dan tunggu persetujuan.

### 4.3 Task tracking

- Pecah pekerjaan menjadi task yang dapat diselesaikan dalam satu sesi.
- Tandai `in_progress` saat mulai dan `completed` setelah terverifikasi.
- Jangan menandai selesai jika masih ada error, test gagal, atau implementasi separuh.

### 4.4 Berhenti dan tanya

Berhenti jika:

- Dokumen saling bertentangan.
- Kebutuhan tidak ada di PRD.
- Perbaikan memerlukan perubahan scope atau dependensi.
- Ada data pengguna yang berisiko tertimpa.
- Dua percobaan perbaikan gagal berturut-turut.

---

## 5. Implementasi

### 5.1 Stack dan struktur

- Next.js App Router + TypeScript + Tailwind CSS, dijalankan sebagai server lokal.
- Ikuti struktur folder pada TRD §5 (`02_source/` untuk aplikasi, `03_qa/` untuk QA).
- Route halaman: `/`, `/new`, `/application?id=...` (query param, bukan segmen dinamis).
- Route API: `/api/applications`, `/api/applications/[id]`, `/api/applications/[id]/extract`, `/api/applications/[id]/extraction`, `/api/applications/[id]/decision`, `/api/profiles`, `/api/reset`.
- Komponen interaktif memakai `'use client'`; modul scoring tetap murni dan hanya dipakai di server.

### 5.2 Data dan scoring

- Seed 5 profil di `02_source/lib/seed.ts`; jangan mengubah nilai tanpa memperbarui PRD §11 dan `02_source/scripts/verify-scores.ts`.
- Persistensi: satu file JSON di server (`02_source/data/db.json`); jika tidak ada/rusak → seed. UI hanya mengakses lewat API.
- Scoring hanya di `02_source/lib/scoring.ts`; UI tidak menghitung poin sendiri.
- Faktor yang ditampilkan: 5 teratas berdasarkan nilai absolut; total kontribusi harus konsisten dengan skor.
- Guardrail dievaluasi di scoring, bukan di komponen.
- Nilai ekstraksi yang dikoreksi analyst menggantikan `thp`, `cicilanTerdeteksi`, dan `inflowBulanan` saat skor dihitung ulang.

### 5.3 UI dan copy

- Sebelum menulis UI: pastikan `01_documents/DESIGN.md` ada. Jika belum, buat dari mockup dan minta persetujuan.
- **Wajib anti-slop** (lihat §5.6): muat `antislop` + `antislop-ui` sebelum menyentuh UI; tambahkan `antislop-layoutmobile` untuk responsive dan `antislop-copywriting` untuk teks.
- Terapkan aturan skill, bukan sekadar membacanya. Jika ada konflik dengan `PRD` atau `DESIGN.md`, dokumen proyek menang dan penyimpangan dicatat.
- Bahasa Indonesia, format Rupiah, tanpa emoji, tanpa hero/gradient/glass.
- Skor dan rekomendasi di atas fold; grade/status selalu disertai teks.
- Responsive 390px–1440px; target sentuh ≥ 44px; kontras WCAG AA.
- Satu aksi utama per layar. `Approve` dan `Reject` harus mudah dibedakan.

### 5.4 Dependensi

- Standar: React, Next.js, Tailwind, TypeScript, `tsx` untuk verifikasi dan unit test.
- Dev dependency yang disetujui: `@playwright/test` untuk E2E.
- Jangan menambah library chart, ikon, tanggal, form, atau state management.
- Jika dependensi benar-benar perlu: jelaskan alasan, ukuran, dan alternatif; tunggu persetujuan.

### 5.5 Kode

- **Wajib anti-slop** (lihat §5.6): muat `antislop` + `antislop-code` sebelum menulis atau mengubah kode.
- Tulis kode sederhana dan langsung; hindari abstraksi prematur.
- Komentar hanya untuk "mengapa" yang tidak jelas; tanpa banner komentar atau komentar yang mengulang kode.
- Validasi hanya di batas input (form, upload, keputusan).
- Jangan menambahkan fallback untuk skenario yang tidak mungkin.
- Jangan menggunakan `dangerouslySetInnerHTML`.
- Tidak ada secret, API key, atau panggilan jaringan eksternal saat runtime; klien hanya memanggil API lokal aplikasi.

### 5.6 Anti-slop wajib

Anti-slop bukan opsional. Setiap perubahan UI atau kode harus memuat skill yang sesuai dan menerapkan aturannya, bukan sekadar membacanya.

| Pekerjaan | Skill wajib |
|---|---|
| Semua perubahan UI | `antislop` + `antislop-ui` |
| Layout responsive | tambah `antislop-layoutmobile` |
| Teks/copy | tambah `antislop-copywriting` |
| Semua perubahan kode | `antislop` + `antislop-code` |
| Pengecekan kontras/a11y | `antislop-human` |

Aturan:

- Jangan menulis UI atau kode sebelum skill dimuat.
- Terapkan aturan skill pada hasil akhir; jika ada konflik dengan `PRD`, `TRD`, atau `DESIGN.md`, dokumen proyek menang dan penyimpangan dicatat di laporan.
- Sebelum melaporkan selesai, lakukan self-review anti-slop dan laporkan PASS/FAIL (lihat §6.4).
- Jangan menganggap "sudah jalan" sebagai bukti bebas slop; periksa pola terlarang secara eksplisit.

### 5.7 Context7 wajib

- Sebelum menulis kode yang bergantung pada API library/framework, muat skill `context7` atau gunakan MCP Context7: `resolve-library-id` lalu `query-docs`.
- Berlaku untuk Next.js, React, Tailwind, TypeScript, `tsx`, dan library lain yang dipakai proyek.
- Cocokkan dokumentasi dengan versi di `package.json`. Jika Context7 menampilkan versi berbeda, ikuti versi terpasang dan catat perbedaannya.
- Jangan mengarang API, opsi konfigurasi, atau nama fungsi dari ingatan.
- Context7 hanya untuk referensi; aturan dependensi di §5.4 tetap berlaku.
- Jika library tidak tersedia di Context7, gunakan dokumentasi resmi versi terpasang dan sebutkan sumbernya.

---

## 6. Review

### 6.1 Review mandiri

Sebelum melaporkan selesai, periksa:

- [ ] Diff hanya menyentuh file yang relevan.
- [ ] API library sesuai dokumentasi Context7 dan versi di `package.json`.
- [ ] Tidak ada kode mati, debug log, atau `console.log` tertinggal.
- [ ] Tidak ada perubahan scope diam-diam.
- [ ] Penamaan konsisten dengan tipe di TRD.
- [ ] Error state dan empty state tersedia.

### 6.2 Verifikasi otomatis

Jalankan sesuai ketersediaan:

```bash
cd 02_source
npm run verify     # skor 5 profil + guardrail C-05
npm run test:unit  # unit test scoring/ekstraksi
npm run test:e2e   # E2E Playwright
npm run build      # build server
npx tsc --noEmit   # typecheck
```

Jangan melaporkan selesai jika perintah di atas gagal.

### 6.3 Verifikasi UI

- Jalankan `npm run dev` dan buka di browser.
- Uji alur: queue → aplikasi baru → upload → ekstraksi → skor → keputusan → log.
- Uji kasus: C-05 guardrail, field confidence rendah, reject tanpa reason code, reset demo.
- Uji lebar 390px, 768px, 1440px; tidak boleh ada horizontal scroll.
- Periksa console: tidak ada error.
- Jika UI tidak dapat diuji, **katakan eksplisit** dan jangan klaim berhasil.

### 6.4 Anti-slop

- Muat `antislop` + `antislop-ui` untuk review UI dan `antislop` + `antislop-code` untuk review kode.
- UI: bandingkan dengan `DESIGN.md` dan mockup PNG; periksa hierarki, kontras, spacing, warna semantik, dan tidak ada dekorasi berlebihan.
- Kode: periksa komentar yang mengulang kode, banner komentar, abstraksi prematur, fallback spekulatif, dan dead code.
- Laporkan **PASS/FAIL** per kategori: layout, tipografi, warna, interaksi, aksesibilitas, kode.
- Pekerjaan belum selesai jika masih ada FAIL yang belum diperbaiki atau dijelaskan.

### 6.5 Konsistensi dokumen

Jika perilaku berubah, perbarui dokumen terkait dalam commit/perubahan yang sama:

- Perubahan scope → BRD + PRD.
- Perubahan layar/alur → PRD.
- Perubahan arsitektur/tipe → TRD.
- Perubahan visual → `DESIGN.md`.

### 6.6 Laporan hasil

Format singkat:

1. Apa yang berubah.
2. Bagaimana diverifikasi (perintah + hasil).
3. Yang belum diuji atau masih terbuka.
4. Langkah berikutnya.

Tanpa klaim berlebihan; bukti sebelum kesimpulan.

---

## 7. Fixing

### 7.1 Alur

1. **Reproduksi** masalah sebelum mengubah kode.
2. Tentukan **root cause**, bukan gejala.
3. Perbaiki dengan diff minimal.
4. Tambahkan atau perbarui verifikasi yang menangkap regresi.
5. Jalankan ulang verifikasi penuh.
6. Periksa alur tetangga yang mungkin terdampak.

### 7.2 Larangan

- Jangan menonaktifkan validasi, guardrail, atau pengecekan untuk "mempercepat".
- Jangan menghapus data atau file untuk menghilangkan error.
- Jangan melewati hook, lint, atau typecheck.
- Jangan melakukan refactor di luar perbaikan.
- Jangan mengubah nilai seed atau bobot scoring hanya agar demo "terlihat bagus"; jika perlu, perbarui PRD dan verifikasi bersama.

### 7.3 Setelah fix

- [ ] Bug asli tidak lagi muncul.
- [ ] Verifikasi otomatis lulus.
- [ ] Alur utama tetap berjalan.
- [ ] Skor kelima profil tidak berubah tanpa alasan yang terdokumentasi.
- [ ] Tidak ada error console baru.

---

## 8. Definition of Done (Demo)

- [ ] `npm install && npm run dev` berjalan tanpa error dari `02_source/`.
- [ ] Kelima profil menghasilkan skor `1000/745/615/525/215`.
- [ ] US-01 s/d US-09 dan SC-01 s/d SC-05 terpenuhi.
- [ ] Queue, form, ekstraksi, detail, guardrail, dan keputusan berfungsi lewat API.
- [ ] PWA dapat di-install dari browser.
- [ ] Layout diuji 390px, 768px, 1440px.
- [ ] Label Demo Mode terlihat.
- [ ] `01_documents/DESIGN.md` ada dan diikuti.
- [ ] UI dan kode lolos review anti-slop; PASS/FAIL dilaporkan.
- [ ] API library terverifikasi via Context7/dokumentasi resmi dan cocok dengan versi terpasang.
- [ ] Test scenario, automated tests, dan QA report tersedia di `03_qa/`.
- [ ] Presentasi ada di `04_presentation/`.
- [ ] Dokumen PRD/TRD konsisten dengan implementasi.
- [ ] Tidak ada error console.

---

## 9. Perintah Verifikasi

| Tujuan | Perintah |
|---|---|
| Jalankan demo | `cd 02_source && npm run dev` |
| Verifikasi skor | `cd 02_source && npm run verify` |
| Unit test | `cd 02_source && npm run test:unit` |
| E2E test | `cd 02_source && npm run test:e2e` |
| Build | `cd 02_source && npm run build` |
| Typecheck | `cd 02_source && npx tsc --noEmit` |
| Cek versi library | `cd 02_source && npm ls next react tailwindcss typescript` |

---

## 10. Komunikasi

- Bahasa percakapan: Indonesia. Identifier kode: Inggris.
- Ringkas dan faktual; tanpa emoji.
- Sertakan path file dan nomor baris saat merujuk kode.
- Jangan bernarasi proses internal; laporkan temuan, keputusan, dan hasil.
- Jika memakai asumsi, tulis eksplisit dan minta konfirmasi bila berdampak.

---

## 11. Pertanyaan Terbuka

Jangan menebak jawaban untuk hal berikut; tanyakan bila relevan:

1. Audiens demo (internal/eksternal).
2. Branding/nama produk.
3. Tanggal target demo.

Sampai dijawab, gunakan branding netral dan data sintetis.
