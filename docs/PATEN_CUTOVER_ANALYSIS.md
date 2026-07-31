# Analisis Cutover PATEN — Product Launch OS 3.0

## Keputusan arsitektur

PATEN menjadi **canonical product experience** untuk seluruh Product Launch OS:

- UI, UX, navigasi, workspace artikel, pipeline, kalender, approvals, tasks,
  reports, dan master data berasal dari `PATEN/src`.
- Portal sistem, autentikasi Supabase, profil pengguna, role, permission, RLS,
  API Cloudinary, dan deployment Vercel dari aplikasi lama tetap dipertahankan.
- URL lama di namespace `/launch/app/*` tetap valid, tetapi seluruhnya masuk ke
  shell PATEN. Ini mencegah bookmark lama dan redirect login terputus.

Pendekatan ini dipilih karena PATEN memiliki model produk yang lebih kaya
daripada skema lama. Memaksa semua struktur PATEN masuk ke kolom lama akan
menghilangkan data seperti skenario produksi, panel readiness, sample findings,
price simulation, dan konfigurasi workspace.

## Model sinkronisasi

### 1. Baseline dari skema operasional lama

Compatibility adapter membaca tabel yang sudah ada dan mengubahnya ke kontrak
PATEN:

| Domain PATEN | Sumber lama |
| --- | --- |
| Article | `launch_projects`, `business_units`, `profiles` |
| Brief/reference | `launch_references` |
| BOM/material candidate | `launch_material_candidates`, `launch_supplier_quotes` |
| Colorway | `launch_colorways` |
| Sampling | `launch_samples` |
| HPP | `launch_hpp_versions`, `launch_hpp_lines` |
| Size chart | `launch_size_charts`, `launch_size_chart_measurements` |
| Production | `launch_production_batches` |
| Launch plan | `launch_release_plans` |
| Variant/stock matrix | `launch_variant_matrix` |
| Tasks | `launch_tasks` |
| Blockers | `launch_blockers` |
| Decision requests | `launch_comments` |
| Approvals | `launch_approvals` |
| Progress updates | `launch_progress_updates` |
| Supplier master | `suppliers` |
| Material master | `materials`, `material_suppliers` |
| Service master | `cost_components` |

Data lama tidak disalin massal ke browser dan tidak lagi memakai `localStorage`
sebagai source of truth.

### 2. PATEN record bridge

Tabel `paten_records` menyimpan bentuk lengkap setiap entity PATEN dalam JSONB,
disertai:

- `record_type` dan `record_id` untuk identitas stabil;
- `project_id` untuk relasi ke proyek lama;
- tombstone `is_deleted` agar record lama yang dihapus tidak muncul kembali;
- `revision`, `updated_by`, dan `updated_at` untuk jejak perubahan;
- RLS berdasarkan permission Product Launch yang sudah ada;
- publikasi Supabase Realtime.

Saat load, adapter membentuk baseline dari tabel lama lalu menggabungkan record
PATEN di atasnya. Record PATEN selalu menang. Dengan pola ini:

- data lama langsung terlihat;
- data PATEN yang lebih kaya tidak hilang;
- cutover tidak membutuhkan reset database;
- rollback UI tidak menghapus data operasional lama.

### 3. Dual-write inti artikel

Perubahan article PATEN juga memperbarui kolom inti `launch_projects`:

- code;
- article name dan category;
- concept dan target user/source notes;
- reference image;
- progress;
- target date;
- acceptance/production notes.

Artikel baru membuat `launch_projects` dengan UUID yang sama sebelum payload
PATEN disimpan. Dengan demikian media, member, audit, dan workflow lama tetap
dapat mengacu ke proyek tersebut.

Entity operasional yang dibuat atau diedit dari PATEN juga disinkronkan ke tabel
normalized yang sesuai:

- task ke `launch_tasks`;
- blocker ke `launch_blockers`;
- approval ke `launch_approvals`;
- progress update ke `launch_progress_updates`;
- supplier ke `suppliers`;
- material ke `materials` dan `material_suppliers`;
- jasa/komponen biaya ke `cost_components`;
- keputusan diskusi ke `launch_comments`.

### 4. Delta write dan realtime

Adapter menyimpan snapshot serialisasi terakhir per record. Pada perubahan:

1. hanya entity yang payload-nya berubah yang ditulis;
2. penghapusan menghasilkan tombstone;
3. write diserialkan dalam satu queue agar input cepat tidak selesai terbalik;
4. event realtime di-debounce;
5. semua client aktif melakukan reload dan merge ulang.

Ini menghindari pola prototype sebelumnya yang menulis ulang seluruh array
untuk setiap perubahan field.

## Batas transaksi dan konsistensi

- `launch_projects` tetap menjadi anchor UUID untuk artikel nyata.
- `paten_records` menjadi canonical state untuk detail PATEN yang belum punya
  bentuk normalized di skema lama.
- UI melakukan optimistic update, lalu menampilkan peringatan persisten jika
  write gagal.
- RLS tidak dibuka untuk anonymous user. Akses mengikuti permission
  `launch.view`, `launch.create`, `launch.edit`, dan `launch.admin`.
- Realtime mencakup bridge dan tabel lama utama sehingga perubahan dari jalur
  legacy masih memicu refresh PATEN.

## Risiko yang sudah dihilangkan

1. **Dua UI aktif dengan perilaku berbeda**  
   Semua URL Product Launch sekarang menuju PATEN.

2. **Mock/localStorage menjadi source of truth**  
   Storage PATEN telah diganti oleh Supabase adapter.

3. **Kehilangan data saat migrasi paksa**  
   Baseline lama dibaca langsung; overlay PATEN tidak merusak tabel lama.

4. **Write amplification**  
   Delta detection dan serialized queue membatasi write ke record yang berubah.

5. **ID tidak kompatibel**  
   Quick Create sekarang menggunakan `crypto.randomUUID()`.

6. **Akses database terlalu longgar**  
   Bridge memakai policy permission existing, bukan policy anon.

## Urutan aktivasi

1. Jalankan migration sampai
   `20260731030000_paten_realtime_bridge.sql` pada Supabase.
2. Pastikan role tim memiliki `launch.view` dan role editor memiliki
   `launch.edit` atau `launch.admin`.
3. Deploy build aplikasi.
4. Lakukan smoke test dengan dua akun:
   - edit brief artikel;
   - tambah task;
   - ubah approval;
   - reschedule kalender;
   - verifikasi perubahan muncul di sesi kedua.
5. Pantau error RLS dan Realtime selama cutover.

## Pekerjaan lanjutan yang disarankan

Prioritas berikutnya bukan mengubah shell lagi, tetapi memperdalam integrasi:

1. Tambahkan RPC transactional untuk perubahan yang harus sekaligus mengubah
   normalized table dan `paten_records`.
2. Tambahkan audit event per keputusan/approval, bukan hanya revision record.
3. Tambahkan integration test Supabase untuk RLS, tombstone, merge, dan
   concurrent update.
4. Setelah pola data stabil, normalisasi field PATEN yang sering difilter atau
   dilaporkan; detail jarang dipakai tetap efisien di JSONB.

## Integrasi media dan diskusi

- Panel Files menerima PNG, JPG, WEBP, PDF, XLSX, dan DOCX.
- Panel Sampling menerima foto bukti temuan fitting.
- File ditandatangani melalui API server, diunggah ke Cloudinary, lalu metadata
  kepemilikan, ukuran, MIME type, dan resource type dicatat ke `media_assets`.
- Penghapusan mendukung Cloudinary resource `image`, `video`, maupun `raw`.
- Daftar file dibangun ulang dari `media_assets`; file contoh statis tidak lagi
  ditampilkan sebagai data nyata.
- Komentar panel Files disimpan ke `launch_comments` dan ikut refresh realtime.

## Hasil verifikasi lokal

- TypeScript typecheck: lulus.
- Unit test: 19/19 lulus, termasuk validasi keamanan file media.
- ESLint: tidak ada error; warning prototype PATEN lama masih tercatat untuk
  cleanup non-blocking.
- Production build: lulus.
