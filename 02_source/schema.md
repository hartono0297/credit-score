# Skema Data dan Invariant

Kontrak JSON aplikasi demo. Sumber: TRD §6, §7, §9. Tipe TypeScript ada di `lib/types.ts`.

## Penyimpanan

- File: `02_source/data/db.json`.
- Dibuat otomatis dari `createSeedState()` bila file tidak ada, kosong, atau rusak.
- Tulis atomik: file sementara lalu `rename`. Mutasi diantrekan in-process agar penulisan tidak bersamaan.
- File runtime, tidak di-commit (lihat `.gitignore`).
- `POST /api/applications` menerima `documents` opsional: maksimal tiga item `{ type, fileName }` dengan tipe `KTP`, `SLIP_GAJI`, atau `MUTASI`. Hanya nama file yang disimpan, tanpa biner.

## StoreState

```json
{
  "version": 2,
  "nextId": 6,
  "applications": []
}
```

| Field | Tipe | Aturan |
|---|---|---|
| `version` | `2` | Harus literal `2`. Nilai lain dianggap rusak dan di-seed ulang. |
| `nextId` | number | Nomor urut aplikasi berikutnya. Seed memakai `6`. |
| `applications` | Application[] | Daftar aplikasi. |

## Application

| Field | Tipe | Aturan |
|---|---|---|
| `id` | string | Format `APP-` + 3 digit, contoh `APP-001`. |
| `profileId` | string | `C-01` sampai `C-05`. |
| `customerName` | string | Nama pada profil demo. |
| `product` | `"BNPL"` | Tetap. |
| `plafon` | number | Rupiah, 5 sampai 50 juta. |
| `tenor` | number | 3, 6, 12, 18, atau 24 bulan. |
| `dp` | number | Rupiah, 0 sampai 50% plafon. |
| `purpose` | string, opsional | Tujuan pengajuan. |
| `status` | Status | `Draft`, `Scored`, `Manual Review`, `Approved`, `Rejected`. |
| `documents` | array | Jenis `KTP`, `SLIP_GAJI`, `MUTASI` beserta `fileName`. Hanya nama file, tanpa biner. |
| `extraction` | Extraction, opsional | Hasil ekstraksi simulasi, termasuk nilai koreksi. |
| `score` | ScoreResult, opsional | Hasil `scoreApplication` pada data terakhir. |
| `log` | DecisionLog[] | Riwayat keputusan, terbaru ditambahkan di akhir. |

Status seed: `APP-001` Approved (satu log `Approved`/`OTHER`), `APP-002` sampai `APP-004` Scored, `APP-005` Manual Review tanpa log.

## Extraction

```ts
type ExtractedField<T> = { value: T; confidence: number; edited?: boolean };
```

| Grup | Field | Sumber |
|---|---|---|
| `ktp` | `nama`, `nik`, `tanggalLahir` | Profil demo |
| `slipGaji` | `employer`, `thp`, `masaKerjaBulan` | Profil demo |
| `mutasi` | `rataRataSaldo`, `inflowBulanan`, `cicilanTerdeteksi` | Profil demo |

- Confidence statis 0,78 sampai 0,96, ditetapkan di `lib/extraction.ts`. `mutasi.cicilanTerdeteksi` selalu 0,78 untuk demo koreksi.
- Field dengan confidence di bawah 0,80 ditandai `Perlu verifikasi`.
- Koreksi analyst mengubah `value` dan menambah `edited: true`. Hanya `thp`, `cicilanTerdeteksi`, dan `inflowBulanan` yang memengaruhi skor.
- Nilai efektif: koreksi bila ada, jika tidak nilai profil. `salaryGap` efektif dihitung `abs(thp - inflow) / thp`.

## ScoreInput dan ScoreResult

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
```

| ScoreResult | Isi |
|---|---|
| `score` | 0 sampai 1000, `clamp(520 + total poin)`. |
| `grade` | `A`, `B`, `C`, `D`, `E`. |
| `dti` | Rasio desimal. |
| `newInstallment` | Cicilan baru dari plafon, tenor, bunga flat 2%. |
| `recommendation` | Teks rekomendasi PRD §12.3. |
| `factors` | 5 faktor teratas berdasarkan nilai absolut poin. Seri diurutkan positif lebih dulu. |
| `allFactors` | 6 faktor lengkap. |
| `guardrails` | `{ id, label }` untuk GR-01, GR-02, GR-03 yang aktif. |
| `narrative` | Ringkasan skor, faktor dominan, dan rekomendasi. |

## Invariant

1. `version` sama dengan `2`.
2. `id` aplikasi unik dan sesuai pola `APP-XXX`.
3. Skor seed: `1000`, `745`, `615`, `525`, `215` dengan grade `A` sampai `E`.
4. `APP-005` memicu `GR-01` dan `GR-02`, status `Manual Review`.
5. Skor hanya dihitung `lib/scoring.ts`. UI tidak menghitung poin.
6. Guardrail dievaluasi di scoring, bukan di komponen.
7. `520 + sum(allFactors.points)` sama dengan skor sebelum clamp.
8. Tidak ada biner upload di penyimpanan; hanya `fileName`.
9. Modul `lib/server/store.ts` hanya dipakai server.
10. Keputusan dapat diubah; setiap keputusan baru menambah entri log.
11. Koreksi extraction ditolak setelah status `Approved` atau `Rejected`.
