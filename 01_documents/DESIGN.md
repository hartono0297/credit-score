# DESIGN.md
## AI Credit Scoring Assistant — Arah Visual

| Item | Keterangan |
|---|---|
| Versi | 1.0 |
| Tanggal | 17 November 2026 |
| Mengacu pada | PRD v0.4, mockup `01_documents/mockups/` |
| Mode antislop | During |

---

## 1. Pembacaan desain

Pembacaan: alat kerja underwriting internal untuk credit analyst BNPL, bahasa visual ledger cetak, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

- ENERGY 1: tenang, rapat, tanpa dekorasi. Ini alat kerja, bukan halaman pemasaran.
- RHYTHM 2: queue, form, dan detail punya komposisi berbeda, tetapi tetap satu keluarga.
- MOTION 1: hanya transisi hover, focus, dan loading. Tidak ada animasi dekoratif.

Fokus setiap layar: satu jawaban utama. Queue: status dan skor. Form: aksi Ekstrak. Detail: skor dan keputusan.

---

## 2. Identitas

Identitas berasal dari cara kerja analyst: membaca bukti, membandingkan angka, lalu memutuskan.

- **Motif: garis ledger.** Aturan horizontal 1px memisahkan bagian bukti. Garis pendek 24px di atas label bagian menandai hierarki, bukan dekorasi.
- **Satu aksen: teal gelap** untuk aksi utama dan focus ring. Warna grade dan status hanya untuk makna risiko.
- **Angka sebagai tokoh utama.** Skor 48px, tabular numerals, rata kiri. Label kecil di atasnya, bukan badge.
- **Tanpa ikon dekoratif.** Panah, bintang, dan ilustrasi tidak dipakai. Teks label sudah cukup.

Alasan satu baris untuk keputusan besar:

| Keputusan | Alasan |
|---|---|
| Latar kertas `#f6f6f4` | Mengurangi silau pada sesi review panjang dan memisahkan panel putih |
| Aksen teal `#0e5b58` | Kontras tinggi di atas putih, tidak bertabrakan dengan warna risiko |
| Font sistem | Tanpa unduhan font, muat cepat, netral untuk alat kerja |
| Radius 4/8/12 | Membedakan input, kartu, dan panel tanpa bentuk pill |
| Tanpa shadow umum | Hierarki dibangun oleh garis dan ruang, bukan bayangan |
| Dua kolom di detail | Bukti dan kesimpulan terlihat bersamaan di desktop |
| Bar faktor | Panjang bar menunjukkan besar kontribusi, tanda +/− tetap eksplisit |

Jika logo dan nama produk diganti, tampilan tetap terbaca sebagai meja kerja kredit karena struktur bukti, angka, dan keputusan yang khas.

---

## 3. Token warna

```css
--bg: #f6f6f4;
--surface: #ffffff;
--surface-muted: #efefec;
--ink: #1a1b1d;
--muted: #5c6066;
--line: #e2e2df;
--line-strong: #cfcfc9;
--accent: #0e5b58;
--accent-ink: #ffffff;
--accent-soft: #e3efed;

--grade-a: #13743a;
--grade-b: #3f7d20;
--grade-c: #9a6a00;
--grade-d: #b4540a;
--grade-e: #a12622;

--ok-bg: #e7f2ea;
--warn-bg: #fbf1d9;
--warn-ink: #6b4a00;
--danger-bg: #fbe9e7;
--danger-ink: #8c1d18;
--info-bg: #e8eef4;
--info-ink: #2d465e;
```

Aturan:

- Teks normal memakai `--ink` di atas `--surface` atau `--bg`.
- `--muted` hanya untuk teks 14px ke atas dengan kontras minimal 4.5:1.
- Grade dan status memakai teks gelap di atas latar tint, bukan teks putih di atas warna terang.
- Merah dan hijau tidak pernah menjadi satu-satunya pembeda; selalu ada label teks.
- Palet inti: netral, teal, dan warna semantik risiko. Tidak ada gradient, glow, atau glass.

---

## 4. Tipografi

```css
font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
font-variant-numeric: tabular-nums;
```

| Peran | Ukuran | Berat | Catatan |
|---|---|---|---|
| Skor utama | 48px / 1.05 | 700 | Tabular, tanpa desimal |
| Judul halaman | 24px / 1.25 | 650 | Satu H1 per halaman |
| Judul bagian | 16px / 1.4 | 650 | Didahului garis ledger 24px |
| Body | 14px / 1.55 | 400 | Maksimal 72 karakter per baris |
| Label form | 13px / 1.4 | 600 | Selalu terlihat, bukan placeholder |
| Metadata | 12px / 1.4 | 500 | Warna `--muted` |
| Angka tabel | 14px | 500 | Tabular |

Tidak memakai uppercase dengan letter-spacing lebar, font monospace dekoratif, atau font eksternal.

---

## 5. Spacing, radius, garis

- Skala spacing: 4, 8, 12, 16, 24, 32, 48, 64.
- Padding kartu: 20px desktop, 16px mobile.
- Jarak antar bagian: 32px desktop, 24px mobile.
- Radius: 4px input dan chip, 8px kartu, 12px panel besar dan dialog.
- Garis: 1px `--line` untuk pemisah, 1px `--line-strong` untuk batas tabel.
- Shadow hanya pada action bar mobile: `0 -1px 0 var(--line)`. Tidak ada shadow kartu.

---

## 6. Layout

### 6.1 Desktop (1024px ke atas)

- Konten maksimal 1200px, margin 32px.
- Queue: ringkasan tiga angka di atas tabel. Tabel penuh dengan kolom Nama, Produk, Skor, Status, Aksi.
- Detail: grid 7/5. Kiri berisi ringkasan, dokumen, dan SLIK. Kanan berisi faktor risiko dan keputusan, sticky di dalam kolom.
- Form: dua kolom untuk field pendek, satu kolom untuk upload dan hasil ekstraksi.

### 6.2 Tablet (768px sampai 1023px)

- Detail menjadi satu kolom, urutan mengikuti PRD: ringkasan, dokumen, SLIK, faktor, keputusan.
- Queue tetap tabel bila muat, tanpa kolom terpotong.

### 6.3 Mobile (390px sampai 767px)

- Satu kolom, padding 16px.
- Queue berubah menjadi kartu. Setiap kartu memuat nama, produk, skor, grade, status, dan tombol Buka.
- Detail bertumpuk. Bagian dokumen, SLIK, dan faktor memakai accordion native yang terbuka secara default untuk ringkasan dan keputusan.
- Action bar keputusan menempel di bawah dengan dua tombol, tinggi minimal 48px.
- Tidak boleh ada horizontal scroll pada 390px.

---

## 7. Komponen

### 7.1 App header

- Kiri: nama aplikasi dan label demo di bawahnya.
- Kanan: Reset Demo dan Aplikasi Baru.
- Reset memakai gaya sekunder, Aplikasi Baru memakai aksen.
- Mobile: judul di baris pertama, aksi di baris kedua, tinggi tombol 44px.

### 7.2 Demo banner

- Teks tetap: `Demo Mode: data simulasi`.
- Latar `--info-bg`, teks `--info-ink`, border kiri 3px `--accent`.
- Selalu terlihat di atas konten, tidak dapat ditutup.

### 7.3 Score badge

- Angka skor 48px dan label `dari 1000`.
- Grade tampil sebagai chip berisi huruf dan kata, misalnya `A, Sangat baik`.
- Warna chip mengikuti grade, teks tetap gelap dan kontras.
- Di queue, skor 20px dan grade chip kecil 12px.

### 7.4 Status badge

- Teks status selalu ada. Titik kecil hanya menandai status dan tidak berkedip.
- Draft: netral. Scored: biru informasi. Manual Review: kuning. Approved: hijau. Rejected: merah.

### 7.5 Confidence chip

- Format persen tanpa desimal, misalnya `94%`.
- Di bawah 80 persen: latar `--warn-bg`, teks `--warn-ink`, label `Perlu verifikasi`.
- Di atas atau sama dengan 80 persen: latar `--ok-bg`, teks `--grade-a`.

### 7.6 Factor bar

- Baris: label faktor, bar, poin bertanda, arah teks (`menaikkan` atau `menurunkan`).
- Bar positif mengarah ke kanan, negatif ke kiri dari garis tengah. Panjang proporsional terhadap nilai absolut.
- Poin nol tetap tampil sebagai bar netral dengan label `tidak mengubah skor`.
- `aria-label` memuat nama faktor dan poin.

### 7.7 Guardrail banner

- Latar `--warn-bg`, border 1px `--warn-ink`.
- Judul `Manual Review diperlukan`.
- Daftar ID dan alasan, misalnya `GR-01: kolektibilitas 3`.
- Tidak dapat ditutup. Catatan wajib ditandai di form keputusan.

### 7.8 Upload slot

- Label field, keterangan `JPG, PNG, atau PDF, maks 10 MB`.
- Tombol pilih file dan nama file setelah dipilih.
- Preview gambar memakai `img` dengan lebar dan tinggi tetap. PDF hanya menampilkan nama.
- Error tampil di bawah slot, terhubung lewat `aria-describedby`.

### 7.9 Extraction list

- Dikelompokkan per dokumen.
- Setiap baris: label, nilai, chip confidence, tombol Ubah.
- Mode edit menampilkan input dengan label eksplisit dan tombol Simpan.
- Input nominal (plafon, DP, koreksi) memakai prefiks `Rp`, angka tabular, dan titik ribuan otomatis saat diketik.
- Field yang dikoreksi menampilkan label `Hasil koreksi analyst`.

### 7.10 SLIK table

- Kolom: Lender, Jenis, Plafon, Baki debet, Kolektibilitas.
- Baris dengan kolektibilitas terburuk diberi latar tint dan teks `Terburuk`.
- Angka Rupiah memakai tabular numerals.

### 7.11 Decision form

- Dua pilihan besar: Approve dan Reject, berbentuk radio card. Approve memakai aksen, Reject memakai `--danger-ink`.
- Select reason code wajib. Catatan wajib saat guardrail aktif.
- Tombol utama: `Simpan Keputusan`. Satu aksi utama per layar.
- Setelah simpan, tampilkan status baru dan entri log terbaru.

### 7.12 Decision log

- Daftar kronologis terbaru di atas.
- Isi: waktu, keputusan, reason code, catatan, guardrail aktif.
- Tidak ada tombol edit atau hapus.

### 7.13 Empty, loading, error

- Empty: sebut penyebab dan satu aksi, misalnya `Belum ada aplikasi. Mulai dengan Aplikasi Baru.`
- Loading queue: tiga baris skeleton dengan teks `Memuat aplikasi...`.
- Loading ekstraksi: spinner dan teks `Mengekstrak dokumen...`, area hasil memakai `aria-live="polite"`.
- Error: pesan Bahasa Indonesia, tanpa stack trace, dengan tombol `Coba lagi`.

---

## 8. Interaksi dan state

- Hover: perubahan warna latar 120ms. Tidak ada transform atau scale.
- Focus: outline 2px `--accent` dengan offset 2px. Tidak pernah `outline: none`.
- Disabled: latar `--surface-muted`, teks `--muted`, cursor `not-allowed`.
- Target sentuh minimal 44x44px.
- Validasi tampil setelah submit, fokus pindah ke error pertama.
- `prefers-reduced-motion: reduce` mematikan semua transisi.

---

## 9. Aksesibilitas

- Satu `h1` per halaman, hierarki heading tanpa lompatan.
- Landmark `header`, `nav`, `main`, `footer`. Skip link ke konten utama.
- Semua input memiliki `label` terlihat.
- Error memakai `aria-describedby` dan `aria-live="polite"`.
- Status dan grade selalu disertai teks.
- Tabel memakai `th` dengan `scope`.
- Kontras minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar.
- Keyboard: Tab, Enter, Space, Escape. Accordion memakai elemen native `details` atau tombol dengan `aria-expanded`.

---

## 10. Copy

- Bahasa Indonesia, kalimat pendek, faktual.
- Format Rupiah: `Rp 12.500.000`. Persen satu desimal bila perlu. Skor tanpa desimal.
- Tanpa emoji, tanpa em dash, tanpa tanda seru.
- CTA spesifik: `Ekstrak Dokumen`, `Hitung Skor`, `Simpan Keputusan`, `Buka aplikasi`.
- Label demo: `Demo Mode: data simulasi`.
- Narasi faktor menyebut angka dan arah, bukan klaim umum.

---

## 11. Larangan visual

- Tanpa gradient, glassmorphism, glow, atau ilustrasi dekoratif.
- Tanpa hero, testimonial, logo bar, atau statistik karangan.
- Tanpa ikon AI, sparkle, bintang, atau panah di setiap tombol.
- Tanpa kartu statistik palsu. Angka ringkasan queue dihitung dari data seed dan diberi label.
- Tanpa pill di semua elemen. Radius mengikuti hierarki.
- Tanpa dark mode pada demo ini. Alasan: alat kerja siang hari dengan mockup light theme; menambah toggle berarti menambah state yang tidak diminta PRD.
