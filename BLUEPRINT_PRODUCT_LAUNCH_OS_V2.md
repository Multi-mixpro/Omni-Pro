# BLUEPRINT PRODUCT LAUNCH OS V2

## GG Indo Apparel — GG Supply dan Gudskuy

**Status:** blueprint induk baru
**Fase aktif:** 01 — Product Launch OS
**Fase berikutnya:** 02 — Attendance, 03 — POS Seller
**Prinsip infrastruktur:** satu project Supabase, satu project Vercel, dan satu akun Cloudinary untuk ketiga sistem.

---

## 1. Keputusan arsitektur induk

Ketiga sistem adalah aplikasi kerja yang terpisah. Satu halaman home hanya berfungsi sebagai portal pemilih sistem; Attendance dan POS Seller tidak tampil sebagai menu di dalam Product Launch OS. Ketiganya tetap memakai satu project Supabase, satu project Vercel, dan satu akun Cloudinary agar biaya serta pengelolaan infrastruktur efisien.

| Batas sistem | Product Launch OS | Attendance | POS Seller |
|---|---|---|---|
| Jalur aplikasi | `/launch/*` | `/attendance/*` | `/pos/*` |
| Halaman login | `/launch/login` | `/attendance/login` | `/pos/login` |
| Permission | hanya `launch.*` | hanya `attendance.*` | hanya `pos.*` |
| Pengguna | tim pengembangan produk | karyawan/anggota operasional | seller, kasir, dan pengelola outlet |
| Navigasi internal | riset sampai siap produksi | kehadiran dan jadwal | penjualan, stok, dan laporan |
| Data | tabel `launch_*` | tabel `attendance_*` | tabel `pos_*` |
| Cloudinary | `gg-indo-apparel/product-launch/*` | `gg-indo-apparel/attendance/*` | `gg-indo-apparel/pos/*` |

Portal home berada di `/` dan menampilkan tiga kartu akses. Memilih kartu selalu membuka halaman login sistem tersebut. Login pada satu sistem tidak otomatis memberi hak akses ke sistem lain; otorisasi tetap diperiksa melalui permission dan RLS pada domain masing-masing.

Nama tabel menggunakan batas domain agar tidak saling bertabrakan:

- shared: `profiles`, `roles`, `permissions`, `team_invites`, `business_units`, `suppliers`, `materials`, `audit_logs`, `media_assets`;
- product launch: seluruh tabel berawalan `launch_`;
- attendance kelak: seluruh tabel berawalan `attendance_`;
- POS kelak: seluruh tabel berawalan `pos_`.

Fase ini tidak membuat tabel bisnis Attendance atau POS. Hanya portal, halaman login terpisah, namespace rute, dan batas fondasinya yang disiapkan.

---

## 2. Tujuan Product Launch OS

Product Launch OS mengubah satu gambar atau referensi dari owner menjadi artikel yang siap diproduksi massal dengan cepat, terukur, dan dapat dipertanggungjawabkan.

Sistem harus menjawab lima pertanyaan setiap saat:

1. Artikel apa yang sedang dikembangkan?
2. Sekarang artikel berada di tahap mana?
3. Siapa yang memegang tindakan berikutnya?
4. Data atau keputusan apa yang masih kurang?
5. Apakah artikel benar-benar aman masuk produksi massal?

### Sasaran operasional

- Owner dapat membuat perintah artikel dalam waktu kurang dari 3 menit.
- Semua anggota tim melihat data dan status yang sama.
- Riset tidak diulang karena supplier, material, dan referensi menjadi pustaka.
- Setiap tahap memiliki gate yang objektif.
- HPP, varian warna, size chart, dan hasil QC memiliki versi dan histori.
- Artikel tidak dapat diberi status siap produksi jika data wajib belum lengkap.
- Keputusan owner dan revisi tim tercatat dalam timeline.

### KPI utama

- lead time dari referensi sampai master sample;
- lead time dari master sample sampai siap produksi;
- jumlah revisi sample per artikel;
- persentase artikel yang lolos gate pertama kali;
- ketepatan HPP final terhadap biaya produksi aktual;
- jumlah artikel terhambat dan umur hambatan;
- jumlah artikel siap produksi per bulan;
- perbandingan performa GG Supply dan Gudskuy.

---

## 3. Struktur unit bisnis

### GG Indo Apparel

Induk pengelola tim, proses, aset, supplier, material, dan sistem.

### GG Supply

Fokus artikel:

- produk polosan siap stok;
- produk dasar yang mudah dikustom;
- kebutuhan mitra percetakan, komunitas, sekolah, kampus, perusahaan, pabrik, restoran, bengkel, instansi, dan pelanggan satuan;
- produk custom dan private label skala berkembang.

Kategori awal meliputi kaos, polo, hoodie, crewneck, jaket, celana, topi, seragam kerja, pakaian bengkel, almamater, jersey, pakaian outdoor, tas tekstil, dan kategori apparel lainnya.

### Gudskuy

Brand fashion milik GG Indo Apparel dengan pilar:

- Gudskuy Daily;
- Gudskuy Sport;
- Gudskuy Outdoor;
- Gudskuy Work;
- pengembangan kategori lifestyle berikutnya.

Gudskuy mengambil pelajaran dari konsistensi dan kelengkapan brand besar, tetapi desain, bahasa visual, identitas, dan produknya wajib orisinal.

---

## 4. Peran tim

Hak sistem diberikan melalui role dan permission, bukan nama yang ditulis di frontend. Pembagian berikut adalah default awal dan dapat diubah owner.

Undangan anggota disiapkan lebih dahulu di `team_invites`. Ketika user Auth dibuat, trigger provisioning mencocokkan email undangan, membuat profil, lalu menetapkan role. Metadata yang dapat diubah pengguna tidak pernah dipercaya untuk menaikkan hak akses.

### Gugun — Owner dan Launch Director

- memberi perintah awal dari gambar/referensi;
- menetapkan unit bisnis, prioritas, konsep, dan target;
- memantau seluruh artikel dan hambatan;
- memberi keputusan pada titik yang memerlukan owner;
- menyetujui HPP/harga dan produksi massal;
- membuka ulang data final dengan alasan;
- mengatur role dan permission.

### Dodi — Product Research dan Costing

- benchmark artikel dan pasar;
- menguji kelayakan konsep;
- mengkoordinasikan detail produk;
- menyusun konsumsi dan komponen HPP;
- menghitung harga rekomendasi dan margin;
- mengajukan review kelayakan produk.

### Syaikhu — Sourcing dan Supplier

- mencari bahan utama dan aksesori;
- mendata supplier dan quotation;
- membandingkan harga, MOQ, lead time, warna, dan risiko;
- mendokumentasikan swatch serta bukti sourcing;
- merekomendasikan supplier dan bahan terpilih.

### Yadi — Sampling, Production, dan QC

- menerjemahkan konsep menjadi pola dan konstruksi;
- membuat dan merevisi sample;
- menetapkan master sample;
- menyusun titik ukur, size chart, dan toleransi;
- memeriksa kesiapan teknis produksi;
- menjalankan QC dan mencatat bukti.

### Pola kolaborasi

Semua anggota dapat melihat artikel. Setiap tahap memiliki satu penanggung jawab utama, tetapi tugas dapat dibagikan. Owner tidak menjadi bottleneck untuk input teknis; owner hanya masuk pada keputusan prioritas, revisi strategis, harga, dan produksi massal.

---

## 5. Alur utama dari referensi sampai produksi

### Tahap 1 — Brief dan arahan

Input minimum:

- gambar referensi;
- nama artikel;
- unit bisnis;
- kategori;
- konsep/tujuan;
- prioritas;
- target siap produksi.

Gate selesai:

- konsep dan hasil yang diharapkan jelas;
- unit bisnis dan kategori ditetapkan;
- owner mengonfirmasi brief.

### Tahap 2 — Riset artikel

Aktivitas:

- benchmark produk sejenis;
- target pengguna dan kegunaan;
- konstruksi/fit/fungsi;
- kisaran pasar dan harga;
- keunggulan serta risiko artikel;
- referensi gambar/link/catatan.

Gate selesai: minimal satu referensi terdokumentasi dan kesimpulan riset tersedia.

### Tahap 3 — Bahan dan supplier

Aktivitas:

- kandidat bahan utama, lining, rib, benang, zipper, label, aksesori, kemasan;
- komposisi, GSM, lebar, karakter, konsumsi awal;
- supplier, harga, satuan, MOQ, lead time, masa berlaku;
- perbandingan kandidat;
- penetapan bahan dan supplier.

Gate selesai: minimal satu quotation berstatus `SELECTED` dan sumber harga dapat ditelusuri.

### Tahap 4 — Sampling

Aktivitas:

- versi sample;
- bahan yang dipakai;
- pola dan konstruksi;
- detail jahitan/finishing;
- foto tiap versi;
- daftar revisi;
- penetapan satu master sample.

Gate selesai: satu sample berstatus `APPROVED` dan `is_master = true`.

### Tahap 5 — HPP dan harga

Komponen:

- material;
- aksesori;
- tenaga/jahit;
- sablon/bordir;
- finishing;
- packaging;
- waste;
- overhead;
- biaya lain;
- margin target;
- harga jual rekomendasi.

Gate selesai: satu versi HPP berstatus `FINAL`. Versi final tidak ditimpa; revisi membuat versi baru.

### Tahap 6 — Spesifikasi final

Aktivitas:

- varian warna dan kode warna;
- panel/kombinasi warna;
- daftar ukuran;
- measurement point;
- nilai per ukuran;
- toleransi plus/minus;
- instruksi produksi.

Gate selesai: minimal satu warna `APPROVED` dan satu size chart `FINAL`.

### Tahap 7 — Quality Control

Pemeriksaan:

- material dan warna;
- ukuran dan toleransi;
- jahitan dan konstruksi;
- fungsi aksesori;
- visual/cacat;
- finishing dan packaging;
- kesesuaian dengan master sample.

Gate selesai: satu pemeriksaan QC berstatus `PASS`. Kegagalan membuat revision request, bukan menghapus histori.

### Tahap 8 — Approval owner

Owner menilai:

- kesiapan artikel;
- HPP dan margin;
- risiko produksi;
- positioning GG Supply/Gudskuy;
- target jumlah produksi;
- catatan final.

Gate selesai: approval tipe `PRODUCTION` berstatus `APPROVED`.

### Tahap 9 — Siap produksi

Sistem hanya mengaktifkan status `READY_FOR_PRODUCTION` jika delapan tahap sebelumnya selesai. Output menjadi paket produksi:

- gambar dan identitas artikel;
- bahan/supplier terpilih;
- master sample;
- HPP final;
- varian warna;
- size chart final;
- hasil QC;
- approval owner;
- catatan produksi massal.

---

## 6. Model status

### Status artikel

- `DRAFT` — brief belum resmi dijalankan;
- `ACTIVE` — artikel sedang berjalan;
- `BLOCKED` — minimal satu hambatan aktif;
- `IN_REVIEW` — membutuhkan review/keputusan;
- `READY_FOR_PRODUCTION` — semua gate selesai;
- `ARCHIVED` — dihentikan tanpa menghapus histori.

### Status tahap

- `NOT_STARTED`;
- `IN_PROGRESS`;
- `WAITING`;
- `BLOCKED`;
- `IN_REVIEW`;
- `REVISION`;
- `COMPLETED`.

### Status tugas

- `TODO`;
- `DOING`;
- `WAITING`;
- `DONE`.

Progress artikel dihitung dari status sembilan tahap dan tidak boleh diketik manual oleh client.

---

## 7. Arsitektur data

### Shared foundation

- `profiles` — identitas anggota dari Supabase Auth;
- `roles`, `permissions`, `role_permissions`, `user_roles` — otorisasi lintas modul;
- `business_units` — GG Supply dan Gudskuy;
- `suppliers` — master supplier bersama;
- `materials` — master material bersama;
- `media_assets` — metadata aset Cloudinary;
- `audit_logs` — jejak sistem.

### Product Launch Core

- `launch_projects`;
- `launch_project_members`;
- `launch_stage_runs`;
- `launch_tasks`;
- `launch_activity`;
- `launch_approvals`.

### Research, sourcing, dan sample

- `launch_references`;
- `launch_material_candidates`;
- `launch_supplier_quotes`;
- `launch_colorways`;
- `launch_samples`.

### Costing, specification, dan quality

- `launch_hpp_versions`;
- `launch_hpp_lines`;
- `launch_size_charts`;
- `launch_size_chart_measurements`;
- `launch_qc_checks`;
- `launch_qc_items`.

### Aturan data wajib

- Auth user tidak dihapus ketika schema aplikasi di-reset.
- Satu project hanya memiliki satu master sample aktif.
- Satu project hanya memiliki satu HPP final.
- Satu project hanya memiliki satu size chart final.
- HPP line total dihitung database.
- Media bytes tidak disimpan di Supabase; hanya metadata dan URL Cloudinary.
- Delete pada data berhistori menggunakan arsip/soft delete kecuali reset sistem yang memang disetujui owner.
- Semua tabel bisnis memakai RLS.

---

## 8. Permission awal

Permission Product Launch memakai prefix `launch.`:

- `launch.view`;
- `launch.create`;
- `launch.edit`;
- `launch.assign`;
- `launch.research.manage`;
- `launch.sourcing.manage`;
- `launch.sample.manage`;
- `launch.hpp.manage`;
- `launch.spec.manage`;
- `launch.qc.manage`;
- `launch.media.manage`;
- `launch.approve`;
- `launch.admin`.

Owner mendapat seluruh permission. Anggota teknis mendapat permission berdasarkan tanggung jawab. UI menyembunyikan aksi yang tidak relevan, tetapi keamanan tetap diputuskan database/RLS.

---

## 9. Informasi dan navigasi aplikasi

Navigasi utama Product Launch OS:

1. **Hari ini** — fokus dan keputusan paling penting;
2. **Artikel** — seluruh portfolio peluncuran;
3. **Pustaka** — supplier dan material yang dapat dipakai ulang;
4. **Tim** — peran, kapasitas, dan tanggung jawab;
5. tombol aksi cepat **Artikel baru**.

Attendance dan POS Seller tidak muncul di navigasi Product Launch OS. Keduanya hanya tersedia sebagai kartu pada portal utama dan mempunyai halaman login masing-masing sampai fasenya mulai dibangun.

### Halaman Hari Ini

Urutan mobile:

1. sapaan dan konteks tanggal;
2. prioritas/keputusan owner;
3. empat angka penting;
4. pipeline horizontal;
5. artikel terbaru;
6. tugas personal.

Desktop memakai dua kolom pada bagian bawah. Mobile memakai satu kolom, bottom navigation, dan floating action button.

### Halaman Artikel

- pencarian nama/kode/kategori;
- filter semua, berjalan, review, terhambat, siap produksi;
- kartu artikel dengan gambar, unit bisnis, tahap, progress, status, dan tenggat;
- target sentuh minimum 42 px;
- filter horizontal pada layar kecil.

### Form Perintah Artikel

Tiga blok:

1. gambar dan identitas;
2. arah produk;
3. prioritas dan target.

Sistem membuat sembilan tahap dan tugas awal secara otomatis. Upload gambar dilakukan setelah project tercipta agar folder Cloudinary memakai project ID.

### Ruang Kerja Artikel

- hero artikel dan kesiapan;
- stage rail sembilan tahap;
- tindakan terbaik berikutnya;
- gate produksi;
- ruang kerja riset, sourcing, sample, HPP, spesifikasi, dan QC;
- tugas;
- timeline aktivitas.

---

## 10. Prinsip UI/UX mobile-first

- informasi terpenting muncul sebelum grafik atau laporan;
- satu layar memprioritaskan satu keputusan utama;
- bottom navigation maksimal empat tujuan aktif;
- aksi membuat artikel selalu dapat dijangkau ibu jari;
- tabel lebar diubah menjadi kartu/section pada mobile;
- stage rail dan filter boleh digeser horizontal;
- form panjang dibagi menjadi blok bernomor;
- warna oranye menandai aksi, bukan dekorasi berlebihan;
- status tidak hanya bergantung pada warna: selalu memakai teks;
- loading, empty, error, dan permission state wajib tersedia;
- tidak ada data bisnis yang disimpan sebagai source of truth di `localStorage`.

Visual direction:

- navy gelap untuk command layer dan kepercayaan;
- oranye GG untuk tindakan dan fokus;
- surface putih, radius moderat, whitespace rapat tetapi lega;
- tipografi Manrope untuk heading dan DM Sans untuk informasi kerja;
- gambar produk menjadi pusat identitas kartu artikel.

---

## 11. Integrasi

### Supabase

- Supabase Auth untuk login;
- username diubah menjadi email melalui RPC aman;
- Postgres menjadi source of truth;
- RLS memeriksa permission;
- RPC membuat project dan seluruh stage secara atomik;
- RPC memvalidasi gate sebelum tahap selesai;
- Realtime dapat ditambahkan pada activity, task, dan stage setelah alur dasar stabil.

### Cloudinary

- upload ditandatangani server Vercel;
- API secret tidak pernah masuk browser;
- folder Product Launch: `gg-indo-apparel/product-launch/{project_id}`;
- metadata disimpan pada `media_assets`;
- penghapusan melakukan destroy ke Cloudinary lalu soft delete metadata.

### Vercel

- frontend Vite tetap menggunakan project Vercel yang sama, dengan portal `/` dan namespace aplikasi yang terpisah;
- setiap sistem memiliki login dan shell navigasi sendiri; tidak ada perpindahan modul dari sidebar aplikasi lain;
- serverless functions menangani signature dan delete Cloudinary;
- environment production menyimpan public key dan secret server secara terpisah;
- SPA rewrite tetap diarahkan ke `index.html`, sedangkan `/api/*` ditangani functions.

---

## 12. Reset dan cutover

Migration reset baru adalah:

`supabase/migrations/20260726010000_product_launch_os_reset.sql`

Migration tersebut:

1. mempertahankan `auth.users`;
2. menghapus seluruh tabel aplikasi lama di schema `public` yang terkait project ini;
3. membangun shared foundation dan Product Launch OS v2;
4. membuat kembali profil dari Auth user yang sudah ada;
5. menetapkan role awal berdasarkan nama/username tim;
6. memastikan minimal satu owner tersedia;
7. mengaktifkan RLS;
8. membuat RPC workflow dan gate produksi.

### Sebelum menerapkan reset

- ekspor database lama jika ada data yang masih perlu disimpan;
- pastikan Vercel mempunyai environment variables terbaru;
- pastikan anon key Supabase valid;
- pastikan Cloudinary API key dan secret tersedia hanya di server;
- hentikan input ke aplikasi lama saat cutover.

### Setelah reset

- login sebagai Gugun;
- cek profil empat anggota;
- koreksi role bila username metadata berbeda;
- buat satu artikel uji GG Supply;
- upload satu gambar referensi;
- cek pembuatan sembilan tahap dan delapan tugas awal;
- cek permission setiap anggota;
- lanjutkan uji sampai gate produksi.

---

## 13. Acceptance criteria fase 01

Fase Product Launch OS dinyatakan siap ketika:

- seluruh halaman utama dapat digunakan pada lebar 360 px tanpa overflow yang merusak;
- halaman `/` menampilkan tiga kartu sistem dan setiap kartu membuka login sistem yang sesuai;
- Product Launch OS hanya dapat diakses melalui `/launch/*` dan tidak menampilkan menu Attendance/POS;
- login memakai Supabase Auth dan profil aktif;
- owner dapat membuat artikel dari gambar;
- gambar tersimpan ke folder Cloudinary yang benar;
- sembilan tahap dan tugas awal dibuat otomatis;
- anggota melihat fokus dan tugas masing-masing;
- supplier/material dapat dipakai ulang dari pustaka;
- versi sample, HPP, size chart, dan QC tidak menimpa histori;
- stage tidak dapat selesai jika gate wajib belum terpenuhi;
- hanya role berizin yang dapat melakukan mutation;
- build produksi berhasil;
- Vercel memakai environment yang sama;
- tidak ada kode lama yang masih menjadi jalur aplikasi aktif.

---

## 14. Urutan implementasi lanjutan

### Sprint A — Cutover fondasi

- terapkan reset migration;
- validasi user/role;
- validasi login dan RLS;
- validasi Cloudinary signed upload;
- uji create project.

### Sprint B — Input detail workstream

- form referensi dan kesimpulan riset;
- form material/supplier/quotation;
- sample version dan gallery;
- worksheet HPP;
- builder warna dan size chart;
- checklist QC dan approval.

### Sprint C — Kolaborasi dan kontrol

- task assignment;
- komentar dan mention;
- realtime activity;
- blocker dan escalation;
- notification center;
- dashboard KPI lead time.

### Sprint D — Paket produksi

- production-ready summary;
- print/export spesifikasi;
- approval certificate;
- handoff ke perencanaan produksi/inventory;
- baseline untuk integrasi POS Seller kelak.

Attendance tetap menjadi fase 02. POS Seller tetap menjadi fase 03. Tidak ada fitur kedua modul tersebut yang dibangun sebelum Product Launch OS stabil.
