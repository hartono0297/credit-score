# Test Scenarios dan Status Eksekusi
## AI Credit Scoring Assistant

| Item | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal eksekusi | 18 November 2026 |
| Commit acuan | `0d642cd` (eksekusi awal), diperbarui pada perbaikan berikutnya |
| Lingkungan | Windows 11, Node 22.14.0, Chrome 156.0.8078.82 |
| Perintah utama | `cd 02_source && npm run qa` (lihat `03_qa/README.md`) |

Status yang dipakai: `Lulus`, `Lulus (parsial)`, `Tidak diuji`, `Tidak diukur`.

---

## 1. Function Test

| ID | Terkait | Skenario | Ekspektasi | Status | Bukti |
|---|---|---|---|---|---|
| FT-01 | US-01 | Buka `/` | 5 aplikasi tampil dengan nama, plafon, skor, grade, status | Lulus | E2E `US-01`; tabel 6 baris termasuk header; skor 1000, 745, 615, 525, 215 |
| FT-02 | US-01 | Klik aksi buka pada baris queue | Detail terbuka sesuai ID | Lulus | E2E `US-01`; tautan `Buka aplikasi` membuka `APP-001` dan heading Andi Pratama |
| FT-03 | US-02 | Unggah 3 dokumen lalu submit dengan field kosong | Pesan validasi per field, fokus ke error pertama | Lulus | E2E `US-02`; pesan profil, plafon, tenor, dan DP; fokus pindah ke select profil |
| FT-04 | US-02 | Isi plafon 4 juta dan 60 juta | Ditolak dengan pesan rentang 5 sampai 50 juta | Lulus | E2E `US-02`; pesan rentang tampil untuk kedua nilai |
| FT-05 | US-02 | Unggah `.txt` dan file 10 MB + 1 byte | Slot menolak file dengan pesan error | Lulus | E2E `US-02` dan `SC-03`; pesan format dan ukuran tampil; tombol Ekstrak tetap nonaktif |
| FT-06 | US-02 | Belum ada 3 dokumen; profil kosong saat submit | Tombol Ekstrak nonaktif sebelum 3 dokumen; tanpa profil muncul `Pilih profil demo.` | Lulus | E2E `SC-03` (tombol nonaktif sebelum dan sesudah file tidak valid) dan `US-02` (pesan `Pilih profil demo.`) |
| FT-07 | US-02 | Lengkapi form dan 3 dokumen, klik Ekstrak | Loading sekitar 1,5 detik, lalu field dan confidence tampil | Lulus (parsial) | E2E `SC-03`; hasil tampil dalam rentang 1,3 sampai 10 detik, batas ketat 1,5 plus minus 0,3 detik tidak diukur |
| FT-08 | US-03 | Periksa Cicilan Terdeteksi pada C-03 | Confidence 78 persen, label Perlu verifikasi | Lulus | E2E `SC-03`; teks `78%` dan `Perlu verifikasi` tampil |
| FT-09 | SC-03 | Ubah field lalu klik Hitung Skor | Skor dan faktor berubah, field ditandai hasil koreksi | Lulus | E2E `SC-03`; THP 12.000.000 menghasilkan skor 720 dan label `Hasil koreksi analyst`; koreksi cicilan dan inflow diuji di unit test |
| FT-10 | US-04, SC-04 | Proses C-01 dari nol | Skor 1000, grade A, rekomendasi approve sesuai pengajuan | Lulus | E2E `SC-04`; skor 1000, `A, Sangat baik`, rekomendasi sesuai pengajuan |
| FT-11 | US-05 | Buka detail setelah skor tersedia | 5 faktor dengan poin, arah, dan narasi | Lulus | E2E `SC-04`; 5 label arah `menaikkan skor`, label faktor, poin `+120`, narasi tampil |
| FT-12 | US-06, SC-02 | Buka C-05 | Status Manual Review, banner GR-01 dan GR-02 | Lulus | E2E `SC-02`; skor 215, grade E, kedua guardrail dan alasannya tampil |
| FT-13 | US-07 | Reject tanpa reason code | Tidak tersimpan, pesan wajib reason code | Lulus | E2E `SC-02`; pesan `Pilih reason code.` dan log tetap kosong |
| FT-14 | US-07 | Reject C-05 tanpa catatan | Tidak tersimpan, catatan wajib | Lulus | E2E `SC-02`; pesan catatan wajib; API mengembalikan 400 |
| FT-15 | US-07 | Simpan keputusan C-02 | Status berubah, log bertambah | Lulus | E2E `SC-01`; status Approved dan 1 entri log |
| FT-16 | PRD 13 | Ubah keputusan C-05 | Entri log baru, entri lama tetap | Lulus | E2E `SC-02`; 2 entri log, entri terbaru di atas |
| FT-17 | PRD 16 | Reset Demo | Data kembali ke 5 seed dan status awal | Lulus | E2E `SC-01`; queue menampilkan 5 aplikasi dan status Budi kembali Scored |
| FT-18 | PRD 16 | Buka `APP-999` dan `TIDAK-ADA` | Empty state dengan tautan kembali | Lulus | E2E `ID tidak ditemukan`; pesan berbeda untuk ID tidak ada dan format salah |
| FT-19 | NFR | Refresh setelah keputusan | Status dan log tetap tersimpan | Lulus | E2E `SC-01`; reload mempertahankan Approved dan 1 log |
| FT-20 | FR-14 | Cek manifest dan install prompt | Manifest valid, service worker terdaftar, prompt tersedia | Tidak diuji | Service worker hanya didaftarkan pada build produksi; install prompt tidak diuji |
| FT-21 | NFR-03 | Viewport 390px | Queue berupa kartu, tanpa horizontal scroll | Lulus | E2E viewport; kartu queue tampil, `scrollWidth` tidak melebihi lebar layar |
| FT-22 | NFR-03 | Viewport 768px dan 1440px | Layout stabil, tabel dan detail terbaca | Lulus | E2E viewport untuk queue, detail C-04, detail C-05, dan form baru |
| FT-23 | A11y | Navigasi keyboard dan Escape | Semua kontrol terjangkau, focus ring terlihat | Tidak diuji | Locator berbasis role dan label lulus; traversal keyboard manual belum dijalankan |
| FT-24 | Error state | Hentikan server lalu lakukan aksi | Pesan error tampil, data tidak berubah | Tidak diuji | Di luar cakupan otomasi |
| FT-25 | US-08 | Buka semua halaman | Label Demo Mode terlihat | Lulus | E2E tiga halaman; banner `Demo Mode: data simulasi` tampil |

---

## 2. Performance Test

| ID | Target | Hasil | Status |
|---|---|---|---|
| PT-01 | Scoring < 1 detik | 1000 panggilan `scoreApplication` selesai dalam 9,8 ms | Lulus |
| PT-02 | Ekstraksi simulasi 1,5 detik plus minus 0,3 detik | Assert E2E 1,3 sampai 10 detik | Lulus (parsial) |
| PT-03 | Muat halaman < 3 detik di lokal | Muat queue setelah pemanasan 877 ms | Lulus |
| PT-04 | Tidak ada overflow horizontal | 390, 768, 1440 px pada 4 halaman, tidak ada overflow | Lulus |
| PT-05 | Lighthouse | Tidak dijalankan | Tidak diukur |

Catatan: pengukuran dilakukan pada dev server di drive D. Next.js menampilkan peringatan filesystem lambat. Angka PT-03 tidak mewakili build produksi.

---

## 3. Penetration Test Terbatas

| ID | Cek | Hasil | Status |
|---|---|---|---|
| SEC-01 | `npm audit` | 14 high, 0 critical; seluruhnya dependency dev transitif | Gagal (diterima) |
| SEC-02 | Secret di bundle | Tidak ada API key, token, atau variabel `NEXT_PUBLIC` | Lulus |
| SEC-03 | Validasi API | Plafon, tenor, DP, profil, dan reason code ditolak dengan 400 | Lulus |
| SEC-04 | ID aplikasi | Format `APP-XXX` divalidasi; percobaan path traversal tidak mengembalikan file | Lulus |
| SEC-05 | Render HTML | Tidak ada `dangerouslySetInnerHTML` | Lulus |
| SEC-06 | Security headers | `nosniff`, `strict-origin-when-cross-origin`, `DENY` | Lulus |
| SEC-07 | Upload | Hanya JPG, PNG, PDF, maks 10 MB; server hanya menerima nama dan tipe file | Lulus |
| SEC-08 | Pesan error | Pesan Bahasa Indonesia tanpa stack trace atau path internal | Lulus |
| SEC-09 | Jaringan | Tidak ada request ke domain eksternal pada halaman utama | Lulus |
| SEC-10 | File data | `db.json` hanya dibaca route server; API tidak di-cache service worker | Lulus |

`npm audit --omit=dev` melaporkan 0 kerentanan. Temuan SEC-01 berasal dari toolchain ESLint dan `picomatch` transitif, bukan dependency runtime.

---

## 4. Negative Case Wajib

| ID | Kasus | Status | Bukti |
|---|---|---|---|
| N-01 | Reject tanpa reason code | Lulus | E2E `SC-02` dan API 400 |
| N-02 | Catatan kosong saat guardrail aktif | Lulus | E2E `SC-02` dan API 400 |
| N-03 | Tipe file salah | Lulus | E2E `SC-03` |
| N-04 | Ukuran file lebih dari 10 MB | Lulus | E2E `US-02` |
| N-05 | ID tidak ditemukan atau format salah | Lulus | E2E `ID tidak ditemukan` |
| N-06 | Koreksi setelah keputusan final | Lulus | E2E `SC-02`; kontrol Ubah hilang dan pesan nonaktif tampil |
| N-07 | Ubah keputusan | Lulus | E2E `SC-02`; log bertambah menjadi 2 |
| N-08 | Reset demo | Lulus | E2E `SC-01` |
| N-09 | Plafon, tenor, atau DP tidak valid | Lulus | E2E `US-02` dan API 400 |

---

## 5. Pemetaan User Story dan Scenario

| ID | Status | Skenario terkait |
|---|---|---|
| US-01 | Lulus | FT-01, FT-02 |
| US-02 | Lulus | FT-03 sampai FT-07 |
| US-03 | Lulus | FT-08, FT-09 |
| US-04 | Lulus | FT-10 |
| US-05 | Lulus | FT-11 |
| US-06 | Lulus | FT-12 |
| US-07 | Lulus | FT-13 sampai FT-16, FT-19 |
| US-08 | Lulus | FT-25 |
| US-09 | Lulus | FT-21, FT-22 |
| SC-01 | Lulus | E2E `SC-01` |
| SC-02 | Lulus | E2E `SC-02` |
| SC-03 | Lulus | E2E `SC-03` dan unit test koreksi |
| SC-04 | Lulus | E2E `SC-04` |
| SC-05 | Lulus (parsial) | E2E viewport C-04 dan C-05 pada 390px; perangkat fisik tidak diuji |

---

## 6. Catatan Pelaksanaan

- Unit test dijalankan dengan `tsx --test`, tanpa framework tambahan.
- E2E memakai Chrome terpasang melalui `channel: chrome`, bukan browser unduhan Playwright.
- Setiap test E2E diawali `POST /api/reset`.
- Artefak kegagalan ditulis ke `03_qa/automated/test-results/` dan tidak di-commit.
- Pada satu run penuh, API keputusan C-05 pernah mengembalikan 500 karena rename file sementara gagal di Windows. Sudah diperbaiki (QD-03): store mengulang rename hingga empat kali. Detail ada di `qa-report.md`.
