# Rencana Implementasi GG Product OS (Implementation Plan)

## 1. Executive Summary Rencana Implementasi

GG Product OS adalah sistem operasi manajemen produk terpadu yang dirancang khusus untuk merek fashion GG Supply dan GUDSKUY. Dokumen ini mendefinisikan rencana implementasi end-to-end yang dibagi menjadi enam fase utama. Pendekatan fase ini memastikan bahwa fondasi sistem dibangun dengan kuat sebelum fitur-fitur kompleks ditambahkan, meminimalisir risiko teknis, dan memungkinkan pengiriman nilai bisnis secara inkremental.

Fokus utama adalah pada **Fase 1 (Fondasi)** dan **Fase 2-4 (Product Launch & Catalog)** yang merupakan core value proposition dari GG Product OS. Modul tambahan seperti Attendance (Fase 5) dan POS Seller (Fase 6) akan disiapkan skemanya, namun UI akan disembunyikan menggunakan mekanisme feature flag hingga fase krusial stabil.

Pendekatan implementasi mengutamakan:
- **Keamanan:** Penerapan Row Level Security (RLS) di Supabase sejak awal.
- **Kualitas:** Pengujian unit dan integrasi otomatis (Vitest, Playwright).
- **Skalabilitas:** Pemisahan logic di layer Service, Repository, dan UI.
- **Arsitektur Modular:** Pengelompokan berdasarkan domain fitur (Core, Launch, Catalog, Attendance, POS).

## 2. Technology Decision Record Final

| Kategori | Teknologi Pilihan | Alasan Pemilihan |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript | Standar industri, ekosistem kaya, TypeScript memastikan type safety. |
| **Build Tool** | Vite 5 | Build sangat cepat, HMR responsif, out-of-the-box support TypeScript & CSS. |
| **Routing** | React Router v6 | Navigasi SPA, nested routes, support route guards, loader/action patterns. |
| **State & Data Fetching** | TanStack Query v5 | Server state management handal, caching otomatis, re-fetching, optimistic updates. |
| **Form Management** | React Hook Form v7 | Performa tinggi, meminimalisir re-render, mudah integrasi dengan schema validation. |
| **Schema Validation** | Zod v3 | Validasi schema end-to-end type safe dari input UI hingga ke backend payload. |
| **Backend as a Service** | Supabase JS v2 | PostgreSQL native, Auth terintegrasi, RLS kuat, Storage, Edge Functions jika diperlukan. |
| **Styling** | Tailwind CSS v3 | Utility-first CSS, konsistensi desain, kecepatan styling, ukuran bundle minimal. |
| **Media Storage** | Cloudinary + Supabase | Cloudinary untuk optimasi gambar (image transformation), Supabase Storage untuk dokumen raw. |
| **Testing** | Vitest + RTL + Playwright | Vitest untuk unit test (kompatibel Vite), RTL untuk komponen, Playwright untuk E2E. |

---

## 3. Rincian per Fase

### Fase 1 — Fondasi (Prioritas Tertinggi)

Fase ini bertujuan menyiapkan environment, core UI shell, autentikasi, manajemen pengguna, roles & permissions, serta infrastruktur database dasar.

#### 3.1 File/Folder
```
package.json
vite.config.ts
tsconfig.json
tsconfig.app.json
.eslintrc.cjs
.prettierrc
tailwind.config.ts
postcss.config.ts
src/main.tsx
src/App.tsx
src/styles/index.css
src/app/router/index.tsx
src/app/providers/index.tsx
src/app/guards/AuthGuard.tsx
src/app/guards/PermissionGuard.tsx
src/app/guards/FeatureFlagGuard.tsx
src/app/layouts/AppLayout.tsx
src/app/layouts/AuthLayout.tsx
src/app/config/constants.ts
src/core/auth/useAuth.ts
src/core/auth/authService.ts
src/core/auth/sessionManager.ts
src/core/users/userRepository.ts
src/core/users/userService.ts
src/core/users/types.ts
src/core/roles/roleRepository.ts
src/core/roles/types.ts
src/core/permissions/permissionResolver.ts
src/core/permissions/permissionRepository.ts
src/core/permissions/types.ts
src/core/feature-flags/featureFlagProvider.tsx
src/core/feature-flags/useFeatureFlag.ts
src/core/feature-flags/types.ts
src/core/media/mediaAdapter.ts
src/core/media/cloudinaryAdapter.ts
src/core/media/supabaseStorageAdapter.ts
src/core/media/types.ts
src/core/audit/auditService.ts
src/core/audit/types.ts
src/core/ui/StatusBadge.tsx
src/core/ui/ProgressBar.tsx
src/core/ui/LoadingSkeleton.tsx
src/core/ui/EmptyState.tsx
src/core/ui/ErrorState.tsx
src/core/ui/PermissionDenied.tsx
src/core/ui/ConfirmDialog.tsx
src/core/ui/FileUploadZone.tsx
src/core/hooks/usePermission.ts
src/core/hooks/useCurrentUser.ts
src/core/utils/date.ts
src/core/utils/format.ts
src/core/utils/cn.ts
src/core/types/global.ts
src/integrations/supabase/client.ts
src/integrations/supabase/types.ts
src/integrations/media/index.ts
supabase/migrations/20240101000001_core_profiles.sql
supabase/migrations/20240101000002_core_roles_permissions.sql
supabase/migrations/20240101000003_core_feature_flags.sql
supabase/migrations/20240101000004_core_audit_logs.sql
supabase/migrations/20240101000005_core_media_files.sql
supabase/migrations/20240101000006_core_rls.sql
supabase/seed/01_roles.sql
supabase/seed/02_permissions.sql
supabase/seed/03_role_permissions.sql
supabase/seed/04_feature_flags.sql
supabase/seed/05_brands.sql
api/cloudinary/sign-upload.ts
api/cloudinary/delete.ts
```

#### 3.2 Migrasi (Urutan Eksekusi)
1. `20240101000001_core_profiles.sql` (Tabel `profiles`)
2. `20240101000002_core_roles_permissions.sql` (Tabel `roles`, `permissions`, `role_permissions`, `user_roles`, `user_permission_overrides`)
3. `20240101000003_core_feature_flags.sql` (Tabel `feature_flags`)
4. `20240101000004_core_audit_logs.sql` (Tabel `audit_logs` dan function trigger)
5. `20240101000005_core_media_files.sql` (Tabel `media_files`)
6. `20240101000006_core_rls.sql` (Aktivasi RLS dan pembuatan policies dasar)

#### 3.3 Service dan Repository
- **AuthService**: Menangani proses login Supabase, sinkronisasi session lokal.
- **UserRepository**: Query profile by ID, update profile.
- **RoleRepository / PermissionRepository**: Mengambil definisi role dan permission list untuk suatu user.
- **PermissionResolver**: Utility murni untuk mengecek apakah `User A` memiliki `Permission X` pada `Context Y`.
- **MediaAdapter**: Interface pengabstraksian upload ke Cloudinary dan Supabase Storage.
- **AuditService**: Menambahkan audit_log secara manual bila trigger PostgreSQL tidak memungkinkan untuk interaksi non-tabel tertentu.

#### 3.4 Route
- `/login` (Public, GuestGuard)
- `/app` (Private, AuthGuard, AppLayout)
- `/app/dashboard` (Private)
- `/app/unauthorized` (Private)

#### 3.5 UI
- **Auth**: Halaman Login (email/password).
- **Layout**: `AppLayout` berisi Sidebar navigation, Header (dengan user menu & brand switcher), dan Main Content area.
- **Komponen Inti**: `LoadingSkeleton`, `StatusBadge`, `ConfirmDialog`, `PermissionDenied`, dll.

#### 3.6 RLS
- `profiles`: SELECT untuk authenticated, UPDATE hanya jika `auth.uid() = id`.
- `roles`, `permissions`, `role_permissions`: SELECT terbuka untuk semua authenticated user, mengubah data dilarang (seed-based).
- `audit_logs`: INSERT oleh trigger/service function, SELECT dibatasi ke role 'owner'.

#### 3.7 Test
- **Unit Test**: Logika `permissionResolver.ts` untuk memverifikasi resolusi izin hierarki (role base + overrides).
- **Integration Test**: Autentikasi dan pemuatan rute aman (redirect jika tidak log in).

#### 3.8 Kriteria Penerimaan (Acceptance Criteria)
- [ ] Build sukses (Vite, TS) tanpa error kompilasi.
- [ ] Pengguna bisa login dengan kredensial Supabase Auth.
- [ ] Jika `is_active` profile false, user ditolak login.
- [ ] Navigasi sidebar terender berdasar permission.
- [ ] Jika user mengakses rute yang terproteksi feature flag nonaktif, dialihkan.
- [ ] RLS mencegah user memanipulasi profil orang lain secara langsung via API Supabase.

#### 3.9 Risiko & Mitigasi
- **Risiko**: Supabase RLS policy terlalu ketat memblokir operasi sah.
- **Mitigasi**: Test ekstensif setiap policy di local Supabase CLI atau database branch sebelum push ke production.
- **Risiko**: Resolver RBAC memakan waktu eksekusi tinggi jika dipanggil tiap render komponen.
- **Mitigasi**: Gunakan context provider dan `useMemo` untuk menyimpan map permissions user saat ini di frontend state.

#### 3.10 Rencana Rollback
- Revert migrasi down untuk ke-6 file SQL.
- Hapus Auth user dari Supabase Dashboard.

---

### Fase 2 — Product Launch Core

Fase perakitan mesin alur kerja "Product Launch" (Perintah Kerja Pembuatan Produk Baru). Fokus ke inisiasi proyek (Work Order) dan sistem Kanban tugas.

#### 3.1 File/Folder (Tambahan)
```
src/launch/work-orders/
src/launch/stages/
src/launch/tasks/
src/launch/dashboards/
supabase/migrations/
  20240102000001_launch_core.sql (brands, work_orders, members, stage_definitions)
  20240102000002_launch_workflow.sql (stage_runs, tasks, updates)
supabase/seed/
  06_stage_definitions.sql
```

#### 3.2 Migrasi
1. `20240102000001_launch_core.sql` (Tabel `launch_brands`, `launch_work_orders`, `launch_work_order_members`, `launch_stage_definitions`)
2. `20240102000002_launch_workflow.sql` (Tabel `launch_stage_runs`, `launch_tasks`, `launch_stage_updates`)

#### 3.3 Service dan Repository
- **WorkOrderService**: Proses pembuatan Work Order baru, trigger otomatis pembuatan Stage Runs berdasarkan `stage_definitions`.
- **WorkOrderRepository**: CRUD Work Orders & pengikatan Members (PIC).
- **StageRunRepository**: Sinkronisasi status stage & pengecekan transisi stage.
- **TaskRepository**: CRUD Kanban tasks dalam stage.

#### 3.4 Route
- `/app/launch/dashboard`
- `/app/launch/work-orders` (Daftar & Kanban)
- `/app/launch/work-orders/:id` (Detail)
- `/app/launch/work-orders/:id/kanban`

#### 3.5 UI
- **Dashboard Owner**: Metric cards (aktif, overdue, waiting review).
- **Dashboard Tim**: "Tugas Saya", deadline, status blocker.
- **List & Kanban**: Tampilan toggle antara Table View dan Kanban View untuk Work Orders & Tasks.
- **Quick Actions**: Tombol ubah status cepat dari UI Kanban.

#### 3.6 RLS
- `launch_work_orders`: SELECT jika user adalah pembuat (creator), Owner, atau terdaftar di `launch_work_order_members`.
- `launch_stage_runs`, `launch_tasks`: Dibatasi visibility mengikuti relasi ke `launch_work_orders` dan assignment.

#### 3.7 Test
- **Unit Test**: Perhitungan persentase progres, validasi workflow gate (misal Stage Brief tidak bisa komplit jika data minimal tidak ada).
- **Integration Test**: Siklus membuat Work Order, verifikasi stage_runs digenerate otomatis.

#### 3.8 Kriteria Penerimaan
- [ ] Owner/Lead bisa membuat Work Order.
- [ ] Semua `stage_runs` (8 tahap) otomatis dibuat saat Work Order disimpan.
- [ ] PIC bisa update status Work Order miliknya; Non-member/viewer tidak bisa merubah.
- [ ] Kanban drag-and-drop status tasks tersimpan ke backend.
- [ ] Dashboard menampilkan data aktual.

#### 3.9 Risiko & Mitigasi
- **Risiko**: Stage creation otomatis gagal karena `stage_definitions` kosong.
- **Mitigasi**: Validasi ketat (Assertion) pada seed data, Service wajib fail-fast jika tidak menemukan template stage.

#### 3.10 Rencana Rollback
- Revert migrasi `20240102000001` dan `20240102000002`.

---

### Fase 3 — Product Development

Fase operasional terberat yang melengkapi seluruh tahap: Material, Supplier, Color, Sample, HPP, Size Chart, hingga QC.

#### 3.1 File/Folder (Tambahan)
```
src/launch/materials/
src/launch/suppliers/
src/launch/samples/
src/launch/hpp/
src/launch/size-charts/
src/launch/qc/
supabase/migrations/
  20240103000001_launch_materials_suppliers.sql
  20240103000002_launch_samples_colors.sql
  20240103000003_launch_hpp_sizes.sql
  20240103000004_launch_qc_eval.sql
```

#### 3.2 Migrasi
1. `20240103000001_launch_materials_suppliers.sql` (materials, suppliers, quotes)
2. `20240103000002_launch_samples_colors.sql` (colors, samples, sample_measurements)
3. `20240103000003_launch_hpp_sizes.sql` (hpp_versions, items, size_charts, sizes, measurement_points, values)
4. `20240103000004_launch_qc_eval.sql` (qc_templates, qc_results, evaluations)

#### 3.3 Service dan Repository
- **HppService**: Kalkulasi formula profit margin, COGS, versioning status (DRAFT/FINAL).
- **SizeChartService**: Versioning dan dynamic row/col generator.
- **QcService**: Validasi pass/fail otomatis terhadap result checklist.
- **SampleService**: Manajemen iterasi Sample (V1, V2, MASTER).

#### 3.4 Route
Sub-route dari `/app/launch/work-orders/:id/`:
- `/materials`
- `/suppliers`
- `/samples`
- `/hpp`
- `/size-chart`
- `/qc`

#### 3.5 UI
- **Sampling UI**: Timeline iterasi sample, upload foto, form measurement approval.
- **HPP UI**: Dynamic row line-item form, ringkasan profit.
- **Size Chart UI**: Tabel Excel-like dengan input toleransi.
- **QC UI**: Checklist form dinamis pass/fail.

#### 3.6 RLS
- Mengikuti akses Work Order induk. Apabila user bisa melihat WO, mereka bisa melihat turunan data (Material, HPP, dll). Hak Edit diatur oleh Roles & Permissions table.

#### 3.7 Test
- **Unit Test**: Engine formula HPP, Validasi Size Chart, Versioning lock logic (FINAL = immutable).
- **Integration Test**: Alur review Supplier, Approval HPP dari DRAFT ke FINAL.

#### 3.8 Kriteria Penerimaan
- [ ] Pengguna bisa memasukkan data material dan supplier penawarannya.
- [ ] HPP yang diset FINAL tidak bisa diubah kembali; harus buat versi baru.
- [ ] Upload gambar Sample menggunakan Cloudinary signed URL berjalan mulus.
- [ ] Fitur checklist QC bisa menggagalkan proses (Gate) bila ada parameter kritis gagal.

#### 3.9 Risiko & Mitigasi
- **Risiko**: Formula HPP frontend tidak sinkron dengan laporan manajemen.
- **Mitigasi**: Ekstraksi logic kalkulasi HPP ke module Typescript tersendiri (di `core/utils`) yang dire-use dan ditest mendalam.

#### 3.10 Rencana Rollback
- Revert migrasi kelompok data `20240103000001` hingga `20240103000004`.

---

### Fase 4 — Catalog

Modul integrasi hilir. Publikasi dari "Product Launch" (Work Order yang selesai) menjadi produk jual di "Catalog".

#### 3.1 File/Folder (Tambahan)
```
src/catalog/products/
src/catalog/variants/
supabase/migrations/
  20240104000001_catalog.sql
```

#### 3.2 Migrasi
1. `20240104000001_catalog.sql` (`catalog_products`, `catalog_product_colors`, `catalog_product_sizes`, `catalog_product_variants`)

#### 3.3 Service dan Repository
- **CatalogPublisherService**: Service yang mengambil relasi dari Data Work Order HPP/SizeChart yang sudah FINAL, lalu memetakan ke entitas Produk Katalog. Dilengkapi mekanisme Idempotent (mencegah publish dobel).

#### 3.4 Route
- `/app/catalog/products` (List Katalog)
- `/app/catalog/products/:id` (Detail & Varian)

#### 3.5 UI
- **List Katalog**: Grid view produk.
- **Variant Manager**: Tabel matriks SKU warna x ukuran.
- **Tombol "Publish ke Katalog"** di halaman Detail Work Order (muncul jika syarat terpenuhi).

#### 3.6 RLS
- Semua internal staff dapat SELECT. Mutasi (INSERT/UPDATE/DELETE) dikhususkan untuk role Seller/Admin/Owner.

#### 3.7 Test
- **Unit Test**: Pengecekan idempotensi di PublisherService.
- **Integration Test**: End-to-end Publish Flow.

#### 3.8 Kriteria Penerimaan
- [ ] Work Order status "Selesai" bisa di-publish ke katalog.
- [ ] Mencoba publish 2 kali menghasilkan peringatan aman, tidak menduplikasi data katalog.
- [ ] Detail matriks Varian SKU terbangun sesuai warna dan ukuran dari tahapan sebelumnya.

#### 3.9 Risiko & Mitigasi
- **Risiko**: Race condition saat klik publish berkali-kali sangat cepat.
- **Mitigasi**: Terapkan Unique Constraint pada kolom `source_work_order_id` di database `catalog_products`.

#### 3.10 Rencana Rollback
- Revert migrasi `20240104000001_catalog.sql`.

---

### Fase 5 & 6 — Attendance & POS Seller

Fase ini hanya mencakup persiapan Backend (Schema SQL) dan Rute kosong (Placeholder). Ini mencegah polusi scope dan memberikan dasar teknis untuk implementasi di masa depan tanpa mengubah arsitektur utama.

#### 3.1 File/Folder (Tambahan)
```
src/attendance/
src/pos/
supabase/migrations/
  20240105000001_attendance.sql
  20240106000001_pos.sql
```

#### 3.2 Migrasi
1. `20240105000001_attendance.sql` (lokasi, shift, jadwal, record absen, koreksi, aktivitas harian)
2. `20240106000001_pos.sql` (profil seller, shift toko, customer, pesanan pos, item, payment, pergerakan kas)

#### 3.3 UI, Route & RLS
- Rute disiapkan (misal `/app/attendance` & `/app/pos`), namun di-wrap oleh `FeatureFlagGuard`.
- State default di tabel `feature_flags`: `FEATURE_ATTENDANCE=false`, `FEATURE_POS=false`.
- Halaman hanya berisi "Coming Soon".
- RLS Attendance: self scope (absen sendiri) & supervisor scope (absen bawahan).
- RLS POS: seller self scope (transaksi kasirnya sendiri).

#### 3.4 Kriteria Penerimaan
- [ ] Skema tabel ter-deploy ke Supabase.
- [ ] Saat flag aktif (hanya admin override via DB), halaman placeholder muncul.
- [ ] Saat flag tidak aktif, rute tidak bisa diakses (redirect 404/Home).

---

## 4. Checklist Kesiapan Antar Fase

Sebelum berpindah ke Fase berikutnya, kondisi berikut harus terpenuhi:

**Dari Fase 1 ke Fase 2:**
- [ ] Autentikasi berjalan solid, re-login berfungsi via cookie/storage, tidak ada memory leak.
- [ ] Role dan Permission bisa diekstrak dari session user dengan presisi 100%.
- [ ] Supabase RLS untuk tabel dasar tidak memiliki lubang keamanan.

**Dari Fase 2 ke Fase 3:**
- [ ] Manajemen Work Order dan penugasan PIC terbukti bebas bug.
- [ ] Board Kanban beroperasi lancar dengan drag-drop yang state-nya persisten di database.

**Dari Fase 3 ke Fase 4:**
- [ ] Keseluruhan alur penciptaan produk dari tahap 1 hingga tahap 8 (termasuk QC dan HPP) telah berhasil disimulasikan hingga final (MASTER release).
- [ ] Semua validasi strict bekerja mencegah workflow cacat disetujui.

---
*Dokumen ini merupakan Blueprint Implementasi yang wajib dipatuhi oleh seluruh developer/agent selama masa pengerjaan GG Product OS.*
