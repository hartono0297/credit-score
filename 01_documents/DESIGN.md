# DESIGN.md
## AI Credit Scoring Assistant — Arah Visual

| Item | Keterangan |
|---|---|
| Versi | 2.0 |
| Tanggal | 19 November 2026 |
| Mengacu pada | PRD v0.4. Dokumen ini adalah acuan visual tunggal untuk v2.0. PNG di `01_documents/mockups/` masih gaya v1.0 dan diganti tangkapan layar implementasi v2.0 setelah redesign selesai |
| Mode antislop | During |

### Riwayat Revisi

| Versi | Tanggal | Perubahan |
|---|---|---|
| 1.0 | 17-11-2026 | Arah ledger cetak: latar kertas, panel bergaris, aksen teal |
| 2.0 | 19-11-2026 | Redesign minimalis: kanvas putih tanpa panel di desktop, kartu di mobile, font Plus Jakarta Sans, skala skor sebagai motif, tombol utama hitam |

---

## 1. Pembacaan desain

Pembacaan: alat kerja underwriting internal untuk credit analyst BNPL, bahasa visual minimalis putih yang tenang, dial **ENERGY 1 / RHYTHM 2 / MOTION 1**.

- ENERGY 1: tenang dan lapang. Ruang kosong dan garis tipis memisahkan bagian, bukan kotak.
- RHYTHM 2: desktop memakai kanvas terbuka, mobile memakai kartu. Queue, form, dan detail punya komposisi berbeda dalam satu keluarga.
- MOTION 1: hanya transisi hover, focus, buka-tutup, dan loading.

Fokus setiap layar: satu jawaban utama. Queue: siapa yang perlu ditinjau. Form: aksi Ekstrak. Detail: skor dan keputusan.

---

## 2. Identitas

Identitas berasal dari pertanyaan yang dijawab analyst: seberapa jauh skor ini dari batas grade berikutnya.

- **Motif: skala skor.** Satu bar 0 sampai 1000 dibagi lima pita grade (E di bawah 500, D 500 sampai 599, C 600 sampai 699, B 700 sampai 799, A 800 ke atas). Penanda vertikal menunjukkan posisi skor. Di queue skala tampil kecil tanpa penanda; pita grade aplikasi itu diwarnai, pita lain netral. Di detail skala tampil penuh dengan angka batas.
- **Angka sebagai tokoh utama.** Skor 56px desktop dan 48px mobile, tabular, rata kiri.
- **Hitam untuk aksi, warna untuk risiko.** Tombol utama memakai `--ink`. Teal hanya untuk focus ring, tautan, dan item aktif. Warna grade dan status hanya untuk makna risiko dan selalu disertai teks.
- **Tanpa ikon dekoratif.** Teks label sudah cukup.

Alasan satu baris untuk keputusan besar:

| Keputusan | Alasan |
|---|---|
| Kanvas putih di desktop | Minimalis yang diminta; hierarki dari ruang dan tipografi, bukan panel |
| Latar `#f5f5f3` dan kartu putih di mobile | Di layar sempit kartu memisahkan bagian yang bertumpuk lebih jelas daripada garis |
| Plus Jakarta Sans | Typeface buatan desainer Indonesia untuk produk berbahasa Indonesia; angka tabular rapi |
| Tombol utama hitam | Satu aksi utama terbaca jelas tanpa bersaing dengan warna risiko |
| Skala skor | Menjawab "seberapa dekat ke grade lain" yang tidak terlihat dari angka saja |
| Approve dan Reject setara | AI bersifat advisory; tampilan tidak menggiring analyst ke satu keputusan |
| Tanpa shadow | Hierarki dari ruang, garis, dan tint |

Jika logo dan nama produk diganti, tampilan tetap terbaca sebagai meja kerja kredit karena skala skor, angka besar, dan pasangan guardrail-keputusan yang khas.

---

## 3. Token warna

```css
--bg: #ffffff;
--bg-mobile: #f5f5f3;
--surface: #ffffff;
--surface-muted: #f4f4f2;
--ink: #17181a;
--ink-hover: #2c2e31;
--muted: #5c6066;
--line: #ececea;
--line-strong: #d9d9d6;
--accent: #0e5b58;
--accent-soft: #e3efed;

--grade-a: #13743a;
--grade-b: #3f7d20;
--grade-c: #9a6a00;
--grade-d: #b4540a;
--grade-e: #a12622;

--band-a: #c8dfcf;
--band-b: #d6e3cc;
--band-c: #efe3c3;
--band-d: #f1dcc8;
--band-e: #e9c9c6;
--band-idle: #ecebe6;

--ok-bg: #e7f2ea;
--warn-bg: #fbf1d9;
--warn-row: #fdf8ec;
--warn-ink: #6b4a00;
--danger-bg: #fbe9e7;
--danger-ink: #8c1d18;
--info-bg: #e8eef4;
--info-ink: #2d465e;
```

Aturan:

- Teks normal memakai `--ink` di atas `--surface`, `--bg`, atau `--bg-mobile`.
- `--muted` dipakai untuk metadata dan teks pendukung; kontrasnya di atas putih dan `--bg-mobile` di atas 4.5:1.
- Warna pita skala bukan pembawa informasi tunggal; grade selalu tertulis sebagai huruf atau kata.
- Grade dan status memakai teks gelap di atas latar tint, bukan teks putih di atas warna terang.
- Palet inti: netral, hitam, teal, dan warna semantik risiko. Tidak ada gradient, glow, atau glass.

---

## 4. Tipografi

```css
font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif;
font-variant-numeric: tabular-nums;
```

- File font disimpan di proyek (woff2, berat 400, 500, 600) dan dimuat lewat `next/font/local`. Tidak ada request ke layanan font saat runtime. Lisensi OFL disertakan di samping file.

| Peran | Ukuran | Berat | Catatan |
|---|---|---|---|
| Skor utama | 56px desktop, 48px mobile / 1 | 600 | Tabular, tanpa desimal, letter-spacing -0.02em |
| Judul halaman | 24px / 1.25 | 600 | Satu H1 per halaman |
| Judul bagian | 15px / 1.4 | 600 | Tanpa garis atau label di atasnya |
| Body | 14px / 1.6 | 400 | Maksimal 72 karakter per baris |
| Label form | 13px / 1.4 | 500 | Selalu terlihat, bukan placeholder |
| Metadata | 12px / 1.4 | 400 | Warna `--muted` |
| Skor di queue | 18px | 600 | Tabular |

Tidak memakai uppercase dengan letter-spacing lebar atau font monospace.

---

## 5. Spacing, radius, garis

- Skala spacing: 4, 8, 12, 16, 24, 32, 48, 64.
- Jarak antar bagian: 32px desktop, 12px antar kartu di mobile.
- Radius: 8px untuk input, tombol, chip, dan blok tint; 14px untuk kartu mobile.
- Garis: 1px `--line` untuk pemisah baris dan bagian, 1px `--line-strong` untuk input.
- Tidak ada shadow. Action bar mobile dipisahkan dengan garis atas `--line`.

---

## 6. Layout

### 6.1 Desktop (1024px ke atas), arah "Tenang"

- Kanvas `--bg` putih, konten maksimal 1200px, margin 32px.
- Bagian tidak dibungkus panel atau border. Pemisah: judul bagian, ruang 32px, dan garis `--line` bila perlu.
- Header: garis bawah tipis, tanpa latar berbeda.
- Queue: judul `Queue aplikasi` dan ringkasan tiga angka sebaris di bawahnya (Total aplikasi, Manual review, Approved) sebagai angka 24px dengan label kecil, tanpa kartu. Tabel tanpa border luar, garis antar baris. Baris Manual Review memakai latar `--warn-row`.
- Detail: grid 7/5. Kiri: ringkasan (skor dan skala, guardrail bila ada, rekomendasi, narasi), dokumen, SLIK. Kanan: faktor risiko dan keputusan, sticky di dalam kolom.
- Guardrail berada tepat di bawah skor dan skala, sebelum rekomendasi dan narasi, sehingga skor dan peringatan terlihat bersama di atas fold.
- Form aplikasi baru: dua kolom untuk field pendek, upload tiga kolom, tanpa panel.

### 6.2 Tablet (768px sampai 1023px)

- Sama dengan desktop, detail menjadi satu kolom dengan urutan PRD: ringkasan, dokumen, SLIK, faktor, keputusan.

### 6.3 Mobile (390px sampai 767px), arah "Saku"

- Latar `--bg-mobile`, padding 12px. Setiap bagian adalah kartu putih radius 14px tanpa border.
- Queue: satu kartu berisi daftar baris. Baris: nama dan metadata di kiri, skor dan huruf grade di kanan, status di bawah nama, skala kecil di bawah skor. Seluruh baris adalah tautan ke detail dengan tinggi minimal 64px.
- Detail: kartu ringkasan (skor 48px, chip grade, skala, rekomendasi), kartu guardrail bila ada, lalu Dokumen, SLIK, dan Faktor risiko sebagai bagian yang bisa dibuka-tutup dengan `details` native. Ringkasan dan keputusan selalu terbuka.
- Action bar keputusan menempel di bawah: dua tombol setara, tinggi minimal 48px.
- Tidak boleh ada horizontal scroll pada 390px.

---

## 7. Komponen

### 7.1 App header

- Kiri: nama aplikasi 15px/600, di bawahnya label `Demo Mode: data simulasi` 12px `--muted` dengan `role="note"`.
- Kanan: `Reset Demo` sebagai tombol ghost. `Aplikasi Baru` menjadi tombol utama `--ink` hanya di halaman queue; di halaman aplikasi baru dan detail memakai gaya sekunder agar aksi halaman (`Ekstrak Dokumen`, `Hitung Skor`, `Simpan Keputusan`) tetap satu-satunya tombol utama.
- Konfirmasi reset muncul sebagai baris di bawah header dengan latar `--surface-muted`.
- Mobile: nama dan label di kiri, dua tombol tetap sebaris bila muat; bila tidak, tombol pindah ke baris kedua. Tinggi tombol 44px.

### 7.2 Demo label

- Teks tetap: `Demo Mode: data simulasi`. Bagian dari header, terlihat di semua halaman, tidak dapat ditutup.
- Strip banner terpisah dihapus.

### 7.3 Score display

- Detail: angka 56px, teks `dari 1000` 13px `--muted`, lalu grade sebagai teks berwarna grade, misalnya `A, Sangat baik`.
- Skala skor penuh di bawah angka: tinggi 8px, celah 2px antar pita, penanda 2x16px `--ink`, angka batas 0, 500, 600, 700, 800, 1000 di bawahnya. `role="img"` dengan `aria-label` yang menyebut skor dan grade.
- Queue: angka 18px dengan huruf grade 12px berwarna grade, skala kecil 110x6px di bawahnya (`aria-hidden`).

### 7.4 Status

- Desktop: teks status 12px berwarna semantik tanpa latar. Mobile: chip 12px dengan latar tint.
- Draft: `--muted`. Scored: `--info-ink`. Manual Review: `--warn-ink`. Approved: `--grade-a`. Rejected: `--danger-ink`.

### 7.5 Confidence chip

- Format persen tanpa desimal, misalnya `94%`, chip radius 8px.
- Di bawah 80 persen: latar `--warn-bg`, teks `--warn-ink`, label `Perlu verifikasi`.
- Di atas atau sama dengan 80 persen: latar `--ok-bg`, teks `--grade-a`.

### 7.6 Factor bar

- Baris: label faktor, bar tipis 6px dari garis tengah, poin bertanda tabular, detail satu kalimat di bawahnya.
- Bar positif ke kanan dengan `--grade-a`, negatif ke kiri dengan `--grade-e`. Panjang proporsional terhadap nilai absolut.
- Poin nol tampil sebagai bar netral dengan label `tidak mengubah skor`.
- `aria-label` memuat nama faktor dan poin.

### 7.7 Guardrail

- Blok `--warn-bg`, radius 8px, tanpa border.
- Judul `Manual Review diperlukan` 13px/600 `--warn-ink`, lalu daftar `GR-01: kolektibilitas 3 (ambang 3)`.
- Tidak dapat ditutup. Catatan wajib ditandai di form keputusan.

### 7.8 Upload slot

- Area 1px dashed `--line-strong`, radius 8px, label dokumen dan keterangan format.
- Setelah dipilih: nama file dan tombol `Ganti`. Preview gambar memakai `img` dengan ukuran tetap.
- Error di bawah slot, terhubung lewat `aria-describedby`.

### 7.9 Extraction list

- Dikelompokkan per dokumen dengan judul bagian kecil.
- Setiap baris: label, nilai, chip confidence, tombol `Ubah` ghost.
- Mode edit: input nominal dengan prefiks `Rp`, angka tabular, titik ribuan otomatis saat diketik, tombol `Simpan` dan `Batal`.
- Field yang dikoreksi menampilkan label `Hasil koreksi analyst`.

### 7.10 SLIK table

- Kolom: Lender, Jenis, Plafon, Baki debet, Kolektibilitas. Tanpa border luar, garis antar baris.
- Baris dengan kolektibilitas terburuk diberi latar tint dan teks `Terburuk`.
- Mobile: setiap fasilitas menjadi baris bertumpuk di dalam kartu SLIK.

### 7.11 Decision form

- Dua pilihan setara, Approve dan Reject, sebagai radio card dengan border 1px. Approve memakai `--accent`, Reject memakai `--danger-ink`. Pilihan terpilih mendapat latar tint warnanya dan border 2px. Tidak ada pilihan yang diisi warna penuh sebelum dipilih.
- Select reason code wajib. Catatan wajib saat guardrail aktif.
- Tombol `Simpan Keputusan` memakai tombol utama `--ink`, lebar penuh di mobile.
- Mobile: action bar bawah memuat Approve dan Reject setara; menekan salah satu memilih keputusan dan menggulir ke form.

### 7.12 Decision log

- Daftar kronologis terbaru di atas, dipisah garis tipis.
- Isi: waktu, keputusan, reason code, catatan, guardrail aktif.
- Tidak ada tombol edit atau hapus.

### 7.13 Empty, loading, error

- Empty: sebut penyebab dan satu aksi, misalnya `Belum ada aplikasi. Mulai dengan Aplikasi Baru.`
- Loading queue: tiga baris skeleton netral dengan teks `Memuat aplikasi...`.
- Loading ekstraksi: spinner dan teks `Mengekstrak dokumen...`, area hasil memakai `aria-live="polite"`.
- Error: pesan Bahasa Indonesia, tanpa stack trace, dengan tombol `Coba lagi`.

### 7.14 Tombol

- Utama: latar `--ink`, teks putih, radius 8px, hover `--ink-hover`.
- Sekunder: border 1px `--line-strong`, latar putih, teks `--ink`, hover `--surface-muted`.
- Ghost: tanpa border, teks `--ink` atau `--accent`, hover `--surface-muted`.
- Satu tombol utama per layar.

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
- Keyboard: Tab, Enter, Space, Escape. Bagian buka-tutup memakai `details` native.
- Nama aksesibel yang dipakai test tetap: `Ringkasan`, `Buka aplikasi`, `Kembali ke queue`, `Reset Demo`, `Aplikasi Baru`, `Total aplikasi`, label form, dan `role="note"` pada label demo.

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
- Tanpa kartu statistik di desktop. Angka ringkasan queue dihitung dari data dan diberi label.
- Tanpa pill di semua elemen. Radius mengikuti hierarki.
- Tanpa garis warna di tepi kiri sebagai dekorasi.

---

## 12. Dampak ke dokumen lain

Diperbarui bersamaan dengan implementasi v2.0:

- TRD §13: blok token awal mengikuti §3 dokumen ini; baris "Satu font stack sistem" diganti "Plus Jakarta Sans disimpan lokal lewat `next/font/local`, fallback font sistem". TRD §15: "tanpa font eksternal" menjadi "tanpa request font ke layanan eksternal saat runtime".
- PRD §9: empat PNG mockup diganti tangkapan layar v2.0 dengan nama file yang sama.
- PRD journey langkah 6: "Banner di atas ringkasan" disesuaikan menjadi "Guardrail tepat di bawah skor".
