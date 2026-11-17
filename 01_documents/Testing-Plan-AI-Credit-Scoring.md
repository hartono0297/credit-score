# Testing Plan (QA)
## AI Credit Scoring Assistant — Demo

| Item | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 17 November 2026 |
| Mengacu pada | BRD v0.5, PRD v0.4, TRD v0.3 |
| Lingkungan | Lokal, Node 24, browser Chromium |

---

## 1. Tujuan

Memastikan demo memenuhi US-01 sampai US-09, SC-01 sampai SC-05, skor seed yang wajib, guardrail, alur keputusan, dan kualitas non-fungsional minimal. Hasil pengujian dicatat di `03_qa/qa-report.md`.

---

## 2. Lingkup

### 2.1 In scope

- Function test untuk tiga layar, form, upload, ekstraksi, koreksi, scoring, guardrail, keputusan, log, reset, dan PWA install.
- Performance test untuk waktu skor, waktu ekstraksi simulasi, dan waktu muat halaman lokal.
- Penetration test terbatas pada aplikasi lokal: validasi input, headers, dependency audit, dan paparan data.

### 2.2 Out of scope

- Uji beban dan DDoS.
- Uji infrastruktur, jaringan, dan hosting.
- Autentikasi dan otorisasi, karena demo tidak memiliki login.
- Uji perangkat mobile fisik; mobile diuji lewat viewport 390px.
- Sertifikasi keamanan formal.

### 2.3 Interpretasi penetration test

Demo berjalan lokal tanpa autentikasi, database, atau data nyata. Penetration test dilakukan sebagai checklist keamanan terarah, bukan uji ofensif penuh. Batasan ini dicatat di QA report.

---

## 3. Lingkungan dan data uji

| Item | Nilai |
|---|---|
| OS | Windows 11 |
| Node | 24.x |
| Runtime | `cd 02_source && npm run dev` |
| Browser | Chromium (Playwright) |
| Data | Seed 5 profil, reset sebelum setiap siklus E2E |
| Akun | Tanpa login |
| Jaringan | Localhost |

---

## 4. Strategi

### 4.1 Function test

Skenario manual dan otomatis mengikuti tabel di bagian 5. Setiap skenario merujuk US atau SC terkait.

### 4.2 Performance test

| ID | Target | Cara ukur |
|---|---|---|
| PT-01 | Scoring < 1 detik | Timer di unit test `scoreApplication` |
| PT-02 | Ekstraksi simulasi 1,5 detik (±0,3 detik) | Timer E2E pada tombol Ekstrak |
| PT-03 | Muat halaman < 3 detik di lokal | Playwright performance timing |
| PT-04 | Tidak ada horizontal overflow | `scrollWidth <= clientWidth` pada 390, 768, 1440 |
| PT-05 | Nilai Lighthouse | Diukur manual bila dijalankan; jika tidak, tulis "not measured" |

### 4.3 Penetration test terbatas

| ID | Cek | Kriteria lulus |
|---|---|---|
| SEC-01 | `npm audit` | Tidak ada high/critical |
| SEC-02 | Secret di bundle | Tidak ada API key atau token |
| SEC-03 | Validasi API | Plafon 5 sampai 50 juta, tenor 3/6/12/18/24, DP 0 sampai 50 persen, reason code wajib |
| SEC-04 | ID aplikasi | Format `APP-XXX` divalidasi; tidak ada path traversal |
| SEC-05 | Render HTML | Tidak ada `dangerouslySetInnerHTML` |
| SEC-06 | Security headers | `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY` |
| SEC-07 | Upload | Hanya JPG/PNG/PDF, maks 10 MB; file tidak dikirim ke server |
| SEC-08 | Pesan error | Tanpa stack trace atau path internal |
| SEC-09 | Jaringan | Tidak ada panggilan ke domain eksternal |
| SEC-10 | File data | `data/db.json` hanya diakses server lokal |

---

## 5. Test scenario

| ID | Terkait | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| FT-01 | US-01 | Buka `/` | 5 aplikasi tampil dengan nama, plafon, skor, grade, status |
| FT-02 | US-01 | Klik satu baris queue | Detail aplikasi terbuka sesuai ID |
| FT-03 | US-02 | Buka `/new`, submit kosong | Pesan validasi per field, fokus ke error pertama |
| FT-04 | US-02 | Isi plafon 4 juta atau 60 juta | Ditolak dengan pesan rentang 5 sampai 50 juta |
| FT-05 | US-02 | Upload file `.txt` atau 11 MB | Slot menolak file dengan pesan error |
| FT-06 | US-02 | Belum pilih profil atau belum 3 dokumen | Tombol Ekstrak Dokumen nonaktif |
| FT-07 | US-02 | Lengkapi form dan 3 dokumen, klik Ekstrak | Loading 1,5 detik, lalu field + confidence tampil |
| FT-08 | US-03 | Periksa field Cicilan Terdeteksi pada C-03 | Confidence 78 persen, chip kuning, label Perlu verifikasi |
| FT-09 | SC-03 | Ubah cicilan C-03, klik Hitung Skor | Skor dan faktor berubah; field ditandai hasil koreksi |
| FT-10 | US-04, SC-04 | Proses C-01 | Skor 1000, grade A, rekomendasi approve sesuai pengajuan |
| FT-11 | US-05 | Buka detail C-03 | 5 faktor dengan poin, arah, dan narasi tampil |
| FT-12 | US-06, SC-02 | Buka C-05 | Status Manual Review, banner GR-01 dan GR-02 |
| FT-13 | US-07 | Approve tanpa reason code | Tidak dapat disimpan, pesan wajib reason code |
| FT-14 | US-07 | Reject C-05 tanpa catatan | Tidak dapat disimpan, catatan wajib saat guardrail |
| FT-15 | US-07 | Simpan keputusan C-02 | Status berubah, entri log bertambah |
| FT-16 | PRD 13 | Ubah keputusan C-02 | Entri log baru ditambahkan, entri lama tetap ada |
| FT-17 | PRD 16 | Reset Demo | Data kembali ke 5 seed dan status awal |
| FT-18 | PRD 16 | Buka `/application?id=TIDAK-ADA` | Empty state dengan tautan kembali ke queue |
| FT-19 | NFR | Refresh setelah keputusan | Status dan log tetap tersimpan |
| FT-20 | FR-14 | Buka di Chromium, cek manifest | Manifest valid, service worker terdaftar, install prompt tersedia |
| FT-21 | NFR-03 | Viewport 390px | Queue berupa kartu, tanpa horizontal scroll |
| FT-22 | NFR-03 | Viewport 768px dan 1440px | Layout stabil, tabel dan detail terbaca |
| FT-23 | A11y | Navigasi keyboard | Semua kontrol terjangkau Tab, focus ring terlihat, Escape menutup elemen yang relevan |
| FT-24 | Error state | Hentikan server, lakukan aksi | Pesan error tampil, data tidak berubah |
| FT-25 | US-08 | Buka semua halaman | Label Demo Mode terlihat |

---

## 6. Automated tests

| Lapisan | Lokasi | Cakupan |
|---|---|---|
| Unit | `03_qa/automated/unit/` | Skor 5 profil, grade, guardrail C-05, top 5 faktor, ekstraksi, koreksi efektif |
| E2E | `03_qa/automated/e2e/` | Queue, aplikasi baru, ekstraksi, koreksi, skor, keputusan, log, reset, viewport |

Perintah:

```bash
cd 02_source
npm run verify
npm run test:unit
npm run test:e2e
```

---

## 7. Severity dan defect

| Severity | Definisi | Contoh |
|---|---|---|
| Critical | Demo tidak dapat dijalankan atau skor wajib salah | Skor C-05 bukan 215 |
| High | Alur utama gagal | Keputusan tidak tersimpan |
| Medium | Fitur pendukung gagal | Reset tidak mengembalikan seed |
| Low | Kosmetik atau copy | Spasi tidak konsisten |

Setiap defect dicatat di QA report dengan ID, langkah reproduksi, severity, dan status.

---

## 8. Entry dan exit criteria

### 8.1 Entry

- Dokumen BRD, PRD, TRD, Testing Plan, dan DESIGN.md tersedia.
- Aplikasi berjalan di lokal dengan seed.
- Test scenario disetujui.

### 8.2 Exit

- Semua FT dengan prioritas Must lulus.
- Tidak ada defect Critical atau High terbuka.
- Unit test, verify, dan E2E lulus.
- Performance target terukur atau ditandai "not measured".
- Checklist keamanan terisi.
- QA report memuat hasil, defect, dan known limitations.

---

## 9. Deliverable

| File | Isi |
|---|---|
| `03_qa/test-scenarios.md` | Salinan skenario dan status eksekusi |
| `03_qa/automated/` | Unit test dan E2E test |
| `03_qa/qa-report.md` | Hasil, defect, known limitations |

---

## 10. Risiko dan batasan

- PWA bukan aplikasi mobile native. Interpretasi ini dicatat untuk penilai.
- Tanpa login, sehingga uji otorisasi tidak berlaku.
- Data sintetis, sehingga hasil tidak menggambarkan performa model nyata.
- Performance diukur di lokal, bukan di jaringan produksi.
