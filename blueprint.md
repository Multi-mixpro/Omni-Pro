# BLUEPRINT SISTEM MANDIRI
# GG PRODUCT OPERATING SYSTEM

**Nama kerja project:** GG Product Operating System  
**Nama singkat:** GG Product OS  
**Status:** Blueprint arsitektur, workflow, database, UI/UX, dan prompt implementasi  
**Model project:** Aplikasi mandiri / greenfield project  
**Bukan bagian dari:** GarSys Pro atau sistem lama lainnya  
**Unit bisnis utama:** GG Supply dan GUDSKUY  
**Modul utama:** Product Launch Workflow  
**Modul pendukung yang disiapkan:** Attendance dan POS Seller  
**Prinsip:** Modular, aman, terukur, mudah dikembangkan, dan tidak saling mengganggu

---

# 0. KEPUTUSAN ARSITEKTUR UTAMA

Project ini **berdiri sendiri sepenuhnya**.

Project tidak menumpang pada GarSys Pro dan tidak menggunakan:

- repository GarSys Pro;
- database GarSys Pro;
- autentikasi GarSys Pro;
- tabel pengguna GarSys Pro;
- hosting GarSys Pro;
- routing GarSys Pro;
- layout GarSys Pro;
- komponen internal GarSys Pro;
- environment variable GarSys Pro;
- deployment GarSys Pro;
- migration GarSys Pro;
- storage GarSys Pro.

GarSys Pro hanya boleh dijadikan referensi pengalaman pengembangan. Tidak ada merger kode, database, atau autentikasi.

Project baru harus memiliki:

1. Repository Git sendiri.
2. Supabase project sendiri.
3. Database sendiri.
4. Autentikasi sendiri.
5. Storage/media configuration sendiri.
6. Vercel project sendiri.
7. Environment variable sendiri.
8. Domain atau subdomain sendiri.
9. Migration history sendiri.
10. Backup dan monitoring sendiri.

Jika ke depan dibutuhkan pertukaran data dengan GarSys Pro, integrasi hanya boleh dilakukan melalui API, export/import, atau connector resmi yang dirancang terpisah. Integrasi tersebut tidak termasuk MVP.

---

# 1. PROMPT UTAMA UNTUK AI CODING AGENT

Gunakan bagian ini sebagai prompt pertama pada code editor yang terintegrasi AI.

> Anda bertindak sebagai **Lead Software Architect, Senior Full-Stack Engineer, Database Engineer, Product Designer, Security Reviewer, dan QA Engineer**.
>
> Baca seluruh file `blueprint.md` sebelum membuat perubahan.
>
> Project ini merupakan aplikasi baru yang berdiri sendiri bernama **GG Product Operating System**. Project tidak boleh bergantung pada GarSys Pro atau project lama lainnya.
>
> Fokus utama aplikasi adalah mengelola workflow pengembangan dan launching artikel produk untuk:
>
> - GG Supply;
> - GUDSKUY.
>
> Aplikasi juga harus mempersiapkan dua modul pendukung:
>
> - Attendance untuk kontrol kehadiran dan aktivitas kerja;
> - POS Seller untuk transaksi penjualan oleh seller.
>
> Product Launch Workflow merupakan prioritas utama. Attendance dan POS Seller harus disiapkan secara modular dan dapat diaktifkan bertahap melalui feature flag.
>
> ## Larangan utama
>
> 1. Jangan menghubungkan repository, database, auth, storage, atau deployment ke GarSys Pro.
> 2. Jangan menyalin kode GarSys Pro secara langsung.
> 3. Jangan membuat aplikasi monolitik yang mencampur seluruh fitur dalam satu halaman atau satu service.
> 4. Jangan menggunakan `localStorage` sebagai sumber data production.
> 5. Jangan menerapkan permission hanya di frontend.
> 6. Jangan menggunakan service-role key atau secret pada browser.
> 7. Jangan membuat tabel tanpa migration.
> 8. Jangan membuat HPP, size chart, atau sampel dengan model yang menimpa histori lama.
> 9. Jangan mengaktifkan Attendance dan POS Seller secara penuh sebelum modul utama stabil.
> 10. Jangan membuat integrasi stok atau keuangan yang belum didefinisikan.
>
> ## Bila repository masih kosong
>
> Buat project baru dengan prinsip berikut:
>
> - TypeScript wajib.
> - Frontend web responsif.
> - PWA-ready.
> - Supabase sebagai database dan autentikasi.
> - Cloudinary atau Supabase Storage dipilih berdasarkan kebutuhan file setelah membuat keputusan arsitektur tertulis.
> - Deployment menggunakan Vercel.
> - Gunakan library stabil dan kompatibel; jangan menggunakan versi eksperimental.
> - Gunakan route modular.
> - Gunakan repository/service layer.
> - Gunakan schema validation.
> - Gunakan query caching.
> - Gunakan migration dan RLS.
> - Gunakan unit test dan integration test.
>
> Pilihan stack default bila tidak ada keputusan lain:
>
> - React;
> - TypeScript;
> - Vite;
> - React Router;
> - TanStack Query;
> - React Hook Form;
> - Zod;
> - Supabase JS;
> - Tailwind CSS atau CSS Modules;
> - Vitest;
> - Playwright untuk alur penting.
>
> Sebelum melakukan scaffold, tulis alasan pemilihan stack dan struktur folder.
>
> ## Bila repository sudah berisi starter project
>
> Audit terlebih dahulu:
>
> - `package.json`;
> - framework;
> - routing;
> - styling;
> - auth;
> - database;
> - environment;
> - testing;
> - deployment.
>
> Pertahankan struktur yang sehat. Jangan melakukan rewrite tanpa alasan kuat.
>
> ## Tahapan pekerjaan
>
> ### Tahap A — Analisis dan perencanaan
>
> Buat dokumen:
>
> - `docs/architecture.md`
> - `docs/database.md`
> - `docs/workflows.md`
> - `docs/ui-ux.md`
> - `docs/security.md`
> - `docs/implementation-plan.md`
> - `docs/testing-plan.md`
>
> Jangan implementasi fitur terlebih dahulu.
>
> Tampilkan:
>
> - stack yang dipilih;
> - struktur folder;
> - route;
> - module boundaries;
> - database ERD;
> - role dan permission;
> - workflow;
> - feature flags;
> - rencana migrasi;
> - deployment;
> - testing;
> - risiko.
>
> Setelah dokumen selesai, berhenti dan tunggu perintah:
>
> `LANJUT BANGUN FONDASI GG PRODUCT OS`
>
> ### Tahap B — Fondasi
>
> Setelah disetujui:
>
> 1. Scaffold project.
> 2. Konfigurasi environment.
> 3. Konfigurasi Supabase.
> 4. Buat migration core.
> 5. Buat auth.
> 6. Buat profile, role, permission, dan RLS.
> 7. Buat app shell dan route guard.
> 8. Buat design system.
> 9. Buat feature flag.
> 10. Buat seed pengguna dan brand untuk development.
>
> Jangan membangun seluruh workflow sebelum fondasi diuji.
>
> ### Tahap C — Product Launch MVP
>
> Implementasikan:
>
> - Dashboard;
> - Perintah Kerja;
> - Kelola & Pantau;
> - Detail Artikel;
> - Material;
> - Supplier;
> - Warna;
> - Sampling;
> - HPP;
> - Size Chart;
> - QC;
> - Approval Artikel;
> - Activity Log;
> - Laporan dasar.
>
> ### Tahap D — Attendance
>
> Aktifkan setelah Product Launch MVP stabil.
>
> ### Tahap E — POS Seller
>
> Aktifkan setelah Product Launch dan katalog internal stabil.
>
> ## Format laporan setiap tahap
>
> Laporkan:
>
> - apa yang dibuat;
> - file baru;
> - file yang diubah;
> - migration;
> - RLS;
> - test;
> - hasil build;
> - error;
> - risiko;
> - keputusan yang dibutuhkan;
> - rollback.
>
> Jangan menyatakan fitur selesai bila test, permission, loading state, error state, dan mobile state belum diperiksa.

---

# 2. VISI SISTEM

GG Product OS menjadi pusat operasional untuk:

- menyusun ide dan brief artikel;
- membagi perintah kerja;
- mengelola riset produk;
- mengelola bahan dan supplier;
- mengembangkan sampel;
- menghitung HPP;
- menetapkan ukuran;
- mengontrol kualitas;
- menyetujui artikel final;
- mempublikasikan artikel ke katalog internal;
- mengontrol kegiatan dan kehadiran tim;
- mendukung penjualan seller;
- menyajikan monitoring Owner.

Sistem tidak hanya menjadi task manager.

Sistem harus menjadi:

- sumber data artikel;
- sumber standar produksi;
- sumber histori pengembangan;
- sumber kontrol tugas;
- sumber keputusan Owner;
- sumber katalog produk internal;
- fondasi aktivitas seller.

---

# 3. RUANG LINGKUP MODUL

## 3.1 Modul utama — Product Launch Workflow

Menangani proses:

```text
Ide / Brief
→ Perintah Kerja
→ Riset Bahan
→ Supplier
→ Warna
→ Sampling
→ HPP
→ Size Chart
→ QC
→ Approval
→ Artikel Final
→ Katalog Internal
```

## 3.2 Modul Attendance

Menangani:

- jadwal kerja;
- shift;
- check-in;
- check-out;
- terlambat;
- izin;
- sakit;
- tidak hadir;
- koreksi absensi;
- rekap kehadiran;
- aktivitas kerja harian;
- monitoring Owner.

Attendance tidak boleh menjadi syarat teknis agar Product Launch dapat berjalan.

Jika Attendance dinonaktifkan, Product Launch tetap berfungsi.

## 3.3 Modul POS Seller

Menangani:

- akun seller;
- shift penjualan;
- daftar produk yang sudah dipublikasikan;
- pencarian produk;
- keranjang;
- pelanggan;
- pesanan;
- pembayaran;
- struk;
- transaksi seller;
- laporan penjualan;
- komisi atau atribusi seller pada fase berikutnya.

POS Seller tidak mengambil artikel yang masih tahap sampling.

Produk hanya tersedia di POS setelah dipublikasikan ke katalog internal dan ditandai dapat dijual.

---

# 4. PRINSIP MODULARITAS

Gunakan module boundaries:

```text
Core
Product Launch
Catalog
Attendance
POS Seller
Reporting
Settings
```

## 4.1 Core

Core menyediakan:

- auth;
- profile;
- role;
- permission;
- organization settings;
- feature flags;
- media;
- activity audit;
- shared UI;
- shared utilities.

## 4.2 Product Launch

Tidak boleh bergantung pada Attendance atau POS.

## 4.3 Catalog

Catalog menjadi jembatan:

```text
Artikel Final
→ Publish Catalog
→ Produk dapat digunakan POS Seller
```

## 4.4 Attendance

Hanya bergantung pada:

- core user;
- team;
- schedule;
- location settings.

## 4.5 POS Seller

Bergantung pada:

- core user;
- catalog;
- customer;
- payment configuration.

## 4.6 Aturan dependency

Diperbolehkan:

```text
Product Launch → Core
Catalog → Core
Catalog → Product Launch
Attendance → Core
POS → Core
POS → Catalog
Reporting → seluruh read model
```

Dilarang:

```text
Product Launch → POS
Product Launch → Attendance
Attendance → POS
Core → Product Launch
Core → Attendance
Core → POS
```

---

# 5. STRUKTUR ROUTE

Route rekomendasi:

```text
/login
/onboarding

/app
/app/dashboard

/app/launch
/app/launch/work-orders
/app/launch/work-orders/new
/app/launch/work-orders/:id
/app/launch/monitor
/app/launch/materials
/app/launch/suppliers
/app/launch/samples
/app/launch/hpp
/app/launch/size-charts
/app/launch/qc
/app/launch/reports

/app/catalog
/app/catalog/products
/app/catalog/products/:id

/app/attendance
/app/attendance/today
/app/attendance/team
/app/attendance/shifts
/app/attendance/requests
/app/attendance/reports

/app/pos
/app/pos/sell
/app/pos/orders
/app/pos/shifts
/app/pos/customers
/app/pos/reports

/app/settings
/app/settings/users
/app/settings/roles
/app/settings/permissions
/app/settings/brands
/app/settings/features
/app/settings/company
```

Gunakan lazy loading per module.

---

# 6. STRUKTUR FOLDER

Contoh:

```text
src/
  app/
    router/
    providers/
    guards/
    layouts/
    config/

  core/
    auth/
    users/
    roles/
    permissions/
    feature-flags/
    media/
    audit/
    ui/
    hooks/
    utils/
    types/

  modules/
    launch/
      domain/
      data/
      services/
      components/
      pages/
      routes/
      schemas/
      tests/

    catalog/
      domain/
      data/
      services/
      components/
      pages/
      routes/
      schemas/
      tests/

    attendance/
      domain/
      data/
      services/
      components/
      pages/
      routes/
      schemas/
      tests/

    pos/
      domain/
      data/
      services/
      components/
      pages/
      routes/
      schemas/
      tests/

    reporting/
    settings/

  integrations/
    supabase/
    media/
    printing/

  styles/
  test/
```

Aturan:

- Page tidak memanggil Supabase secara langsung.
- Query melalui repository.
- Mutation melalui service.
- Permission berada di database dan application guard.
- Kalkulasi HPP berada di domain.
- Workflow transition berada di service.
- UI tidak menentukan kebenaran bisnis.

---

# 7. ROLE PENGGUNA

## 7.1 Owner / Super Admin — Gugun

Hak:

- seluruh data;
- seluruh task;
- membuat perintah;
- menentukan creator;
- menentukan PIC;
- review;
- approval;
- publish catalog;
- attendance monitoring;
- POS report;
- user;
- role;
- permission;
- feature flag;
- company settings.

## 7.2 Product Lead — Dodi

Fokus:

- riset;
- artikel;
- bahan;
- supplier;
- HPP;
- relasi mitra.

## 7.3 Production Lead — Yadi

Fokus:

- pola;
- sampling;
- resep produksi;
- ukuran;
- dokumentasi;
- QC teknis.

## 7.4 Sourcing & Production Admin — Syaikhu

Fokus:

- supplier;
- kain;
- aksesori;
- sablon;
- bordir;
- label;
- packaging;
- dokumentasi;
- SOP.

## 7.5 Creative

Fokus:

- foto;
- desain;
- konten;
- katalog;
- visual brand.

## 7.6 QC

Fokus:

- checklist;
- ukuran;
- konstruksi;
- approval QC.

## 7.7 Seller

Fokus:

- POS;
- order;
- pelanggan;
- pembayaran;
- transaksi sendiri.

## 7.8 Attendance Supervisor

Fokus:

- jadwal;
- koreksi;
- izin;
- laporan kehadiran.

## 7.9 Viewer

Read-only sesuai scope.

---

# 8. PERMISSION CODE

## 8.1 Core

```text
core.users.view
core.users.manage
core.roles.view
core.roles.manage
core.permissions.manage
core.features.manage
core.audit.view
```

## 8.2 Launch

```text
launch.dashboard.view
launch.work_order.view_assigned
launch.work_order.view_all
launch.work_order.create
launch.work_order.edit
launch.work_order.assign
launch.work_order.cancel

launch.material.view
launch.material.manage

launch.supplier.view
launch.supplier.manage
launch.supplier.approve

launch.color.manage

launch.sample.view
launch.sample.manage
launch.sample.approve

launch.hpp.view
launch.hpp.manage
launch.hpp.finalize

launch.size_chart.view
launch.size_chart.manage
launch.size_chart.finalize

launch.qc.view
launch.qc.manage
launch.qc.approve

launch.article.review
launch.article.approve
launch.article.publish

launch.report.view
```

## 8.3 Attendance

```text
attendance.self.view
attendance.self.checkin
attendance.self.checkout
attendance.self.request

attendance.team.view
attendance.schedule.manage
attendance.correction.manage
attendance.report.view
```

## 8.4 POS

```text
pos.sell
pos.shift.open
pos.shift.close
pos.order.view_own
pos.order.view_all
pos.order.void
pos.payment.manage
pos.customer.manage
pos.report.view
```

---

# 9. FEATURE FLAGS

Feature flags:

```text
FEATURE_PRODUCT_LAUNCH=true
FEATURE_CATALOG=true
FEATURE_ATTENDANCE=false
FEATURE_POS_SELLER=false
FEATURE_REALTIME=false
FEATURE_PWA=false
FEATURE_GEO_ATTENDANCE=false
FEATURE_SELFIE_ATTENDANCE=false
```

Aturan:

- Product Launch aktif pertama.
- Catalog aktif saat artikel final dapat dipublikasikan.
- Attendance disiapkan tetapi default nonaktif.
- POS Seller disiapkan tetapi default nonaktif.
- Route dan menu mengikuti flag.
- Permission tetap diperiksa.
- Feature flag bukan pengganti keamanan.

---

# 10. WORKFLOW PRODUCT LAUNCH

## 10.1 Status Work Order

```text
DRAFT
ACTIVE
ON_HOLD
IN_REVIEW
APPROVED
PUBLISHED
CANCELLED
ARCHIVED
```

## 10.2 Delapan tahap utama

### 1. Brief Artikel

Input:

- brand;
- nama produk;
- kode artikel;
- kategori;
- tujuan;
- target pasar;
- warna;
- foto;
- link referensi;
- kebutuhan custom;
- prioritas;
- deadline;
- PIC;
- tim;
- arahan Owner.

Output:

- perintah aktif;
- stage instances;
- assignment;
- activity log.

### 2. Riset Bahan

Input:

- kandidat kain;
- karakter;
- komposisi;
- gramasi;
- lebar;
- estimasi konsumsi;
- kecocokan;
- risiko;
- foto swatch.

Output:

- material candidate;
- rekomendasi;
- perbandingan.

### 3. Fix Supplier

Input:

- supplier;
- harga;
- MOQ;
- lead time;
- warna;
- quotation;
- minimum produksi;
- validasi harga.

Output:

- supplier terpilih;
- quotation approved.

### 4. Fix Warna

Input:

- warna;
- kode internal;
- supplier code;
- panel;
- swatch;
- approval.

Output:

- daftar warna final.

### 5. Fix Sampel

Input:

- versi sampel;
- foto;
- bahan;
- pola;
- jahitan;
- aksesori;
- catatan;
- revisi;
- ukuran aktual.

Output:

- histori sampel;
- master sample.

### 6. Fix HPP

Input:

- kain;
- konsumsi;
- lining;
- aksesori;
- potong;
- jahit;
- sablon;
- bordir;
- label;
- packaging;
- finishing;
- QC;
- transport;
- produk gagal;
- overhead;
- margin target.

Output:

- HPP final version;
- harga jual rekomendasi.

### 7. Fix Size Chart

Input:

- size;
- measurement point;
- nilai;
- toleransi;
- diagram;
- versi.

Output:

- size chart final.

### 8. QC dan Artikel Final

Input:

- checklist;
- sampel master;
- HPP final;
- size chart;
- dokumen;
- foto;
- approval.

Output:

- artikel approved;
- ready to publish.

---

# 11. WORKFLOW TASK DAN MONITORING

## 11.1 Perintah Kerja

Fungsi:

- daftar eksekusi;
- artikel assigned;
- stage;
- task;
- deadline;
- komentar;
- update;
- file;
- blocker.

## 11.2 Kelola & Pantau

Khusus Owner dan pengguna `view_all`.

Menampilkan:

- seluruh artikel;
- seluruh PIC;
- overdue;
- blocked;
- stage idle;
- waiting review;
- HPP belum final;
- sampel terlalu banyak revisi;
- supplier belum fix;
- artikel tanpa update;
- kesiapan per brand.

## 11.3 Satu sumber data

Tidak ada tabel monitoring kedua.

```text
Work Order
+ Stage Run
+ Task
+ Assignment
+ Activity
= Monitoring
```

---

# 12. SUBTASK

Satu stage dapat memiliki subtask.

Contoh sampling:

- persiapkan pola;
- potong bahan;
- jahit body;
- pasang aksesori;
- foto sampel;
- ukur sampel;
- review;
- revisi.

Subtask field:

```text
title
description
assignee
status
priority
due_date
completed_at
dependency_task_id
```

Status:

```text
TODO
IN_PROGRESS
WAITING
BLOCKED
DONE
CANCELLED
```

---

# 13. DATABASE CORE

Gunakan UUID.

Gunakan:

- `created_at`;
- `updated_at`;
- `created_by`;
- soft delete bila relevan;
- index;
- foreign key;
- constraint;
- RLS.

## 13.1 `profiles`

```text
id
full_name
email
phone
avatar_url
job_title
department
is_active
created_at
updated_at
```

ID terkait Supabase Auth.

## 13.2 `roles`

```text
id
code
name
description
is_system
created_at
```

## 13.3 `permissions`

```text
id
code
module
description
created_at
```

## 13.4 `role_permissions`

```text
role_id
permission_id
is_allowed
```

## 13.5 `user_roles`

```text
user_id
role_id
assigned_by
assigned_at
```

## 13.6 `user_permission_overrides`

```text
user_id
permission_id
is_allowed
granted_by
created_at
```

## 13.7 `feature_flags`

```text
code
is_enabled
description
updated_by
updated_at
```

## 13.8 `audit_logs`

```text
id
module
entity_type
entity_id
action
before_data
after_data
actor_user_id
created_at
request_id
```

Append-only.

## 13.9 `media_files`

```text
id
provider
public_id
url
secure_url
folder
original_filename
mime_type
file_size
width
height
metadata
uploaded_by
created_at
deleted_at
```

---

# 14. DATABASE PRODUCT LAUNCH

## 14.1 `launch_brands`

```text
id
code
name
description
is_active
created_at
updated_at
```

Seed:

```text
GG_SUPPLY
GUDSKUY
```

## 14.2 `launch_work_orders`

```text
id
brand_id
article_code
article_name
category
product_type
purpose
target_market
description
custom_capability
priority
target_date
primary_pic_user_id
current_stage_code
overall_status
progress_percent
reference_url
hero_media_id
created_by
created_at
updated_at
approved_by
approved_at
cancelled_at
cancel_reason
published_catalog_product_id
```

## 14.3 `launch_work_order_members`

```text
id
work_order_id
user_id
assignment_role
is_primary
assigned_by
assigned_at
```

## 14.4 `launch_stage_definitions`

```text
id
code
name
sequence_no
description
weight
completion_rules
is_active
```

## 14.5 `launch_stage_runs`

```text
id
work_order_id
stage_definition_id
assigned_user_id
status
started_at
due_at
completed_at
completed_by
reviewed_at
reviewed_by
summary
blocked_reason
revision_reason
updated_at
```

## 14.6 `launch_tasks`

```text
id
work_order_id
stage_run_id
title
description
assigned_user_id
priority
status
due_date
dependency_task_id
completed_at
completed_by
created_by
created_at
updated_at
```

## 14.7 `launch_stage_updates`

```text
id
stage_run_id
update_type
from_status
to_status
note
created_by
created_at
```

## 14.8 `launch_material_candidates`

```text
id
work_order_id
material_name
composition
gsm
width_cm
unit
estimated_consumption
characteristics
suitability_reason
risks
status
swatch_media_id
created_by
created_at
updated_at
```

## 14.9 `launch_suppliers`

```text
id
supplier_code
supplier_name
category
contact_name
phone
email
address
notes
status
created_by
created_at
updated_at
```

## 14.10 `launch_supplier_quotes`

```text
id
work_order_id
material_candidate_id
supplier_id
item_name
price
currency
price_unit
moq
moq_unit
lead_time_days
available_colors
quotation_media_id
price_checked_at
valid_until
status
reviewed_by
reviewed_at
notes
```

## 14.11 `launch_article_colors`

```text
id
work_order_id
color_name
internal_color_code
supplier_color_code
panel_scope
hex_reference
swatch_media_id
is_final
approved_by
approved_at
notes
```

## 14.12 `launch_samples`

```text
id
work_order_id
version_no
sample_code
parent_sample_id
status
sample_date
material_summary
pattern_summary
construction_summary
result_summary
revision_notes
is_master_sample
approved_by
approved_at
created_by
created_at
```

## 14.13 `launch_sample_measurements`

```text
id
sample_id
measurement_point_id
value
target_value
deviation
tolerance
is_pass
notes
```

## 14.14 `launch_hpp_versions`

```text
id
work_order_id
version_no
status
currency
reject_pct
overhead_pct
target_margin_pct
direct_cost_total
reject_cost_total
overhead_cost_total
hpp_total
suggested_selling_price
prepared_by
reviewed_by
finalized_by
finalized_at
notes
created_at
```

## 14.15 `launch_hpp_items`

```text
id
hpp_version_id
category
item_name
quantity
unit
unit_cost
total_cost
supplier_quote_id
source_note
sort_order
```

Kategori:

```text
FABRIC
LINING
ACCESSORY
CUTTING
SEWING
PRINTING
EMBROIDERY
LABEL
PACKAGING
FINISHING
QUALITY_CONTROL
TRANSPORT
OTHER
```

## 14.16 `launch_size_chart_versions`

```text
id
work_order_id
version_no
chart_name
unit
status
source_sample_id
prepared_by
reviewed_by
finalized_by
finalized_at
notes
created_at
```

## 14.17 `launch_size_chart_sizes`

```text
id
size_chart_version_id
size_code
display_order
notes
```

## 14.18 `launch_measurement_points`

```text
id
code
name
applicable_categories
description
diagram_media_id
is_active
```

## 14.19 `launch_size_chart_values`

```text
id
size_chart_size_id
measurement_point_id
value
tolerance_plus
tolerance_minus
notes
```

## 14.20 `launch_qc_templates`

```text
id
name
category
version_no
is_active
created_by
created_at
```

## 14.21 `launch_qc_template_items`

```text
id
template_id
check_code
check_name
check_description
is_required
display_order
```

## 14.22 `launch_qc_results`

```text
id
work_order_id
sample_id
template_item_id
result
note
checked_by
checked_at
```

## 14.23 `launch_evaluations`

```text
id
evaluation_type
period_start
period_end
brand_id
title
summary
achievements
blockers
decisions
next_actions
created_by
created_at
```

---

# 15. FORMULA HPP

```text
direct_cost_total =
SUM(hpp_items.total_cost)

reject_cost_total =
direct_cost_total × reject_pct / 100

overhead_cost_total =
(direct_cost_total + reject_cost_total)
× overhead_pct / 100

hpp_total =
direct_cost_total
+ reject_cost_total
+ overhead_cost_total

suggested_selling_price =
hpp_total / (1 - target_margin_pct / 100)
```

Aturan:

- biaya tidak boleh negatif;
- margin harus lebih kecil dari 100%;
- total dihitung ulang pada server/service;
- nilai total dari client tidak dipercaya;
- finalisasi memakai transaction;
- HPP final tidak diedit;
- revisi membuat versi baru;
- histori dipertahankan.

---

# 16. DATABASE CATALOG

Catalog menerima artikel final.

## 16.1 `catalog_products`

```text
id
source_work_order_id
brand_id
product_code
product_name
category
description
hero_media_id
status
can_be_customized
is_sellable
published_by
published_at
created_at
updated_at
```

Status:

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

## 16.2 `catalog_product_colors`

```text
id
product_id
color_name
color_code
swatch_media_id
is_active
```

## 16.3 `catalog_product_sizes`

```text
id
product_id
size_code
display_order
is_active
```

## 16.4 `catalog_product_variants`

```text
id
product_id
color_id
size_id
sku
barcode
base_price
cost_price
is_active
```

Pada fase awal, stock quantity boleh belum tersedia.

## 16.5 Publish flow

```text
Artikel Approved
→ Preview Payload
→ Owner Publish
→ Catalog Product
→ Variant
→ POS Eligible
```

Publish harus idempotent.

---

# 17. DATABASE ATTENDANCE

Attendance disiapkan sebagai modul terpisah.

## 17.1 `attendance_locations`

```text
id
name
address
latitude
longitude
radius_meter
is_active
created_at
updated_at
```

Lokasi opsional.

GPS tidak wajib diaktifkan pada MVP.

## 17.2 `attendance_shift_templates`

```text
id
code
name
start_time
end_time
late_tolerance_minutes
early_checkout_tolerance_minutes
is_active
created_at
updated_at
```

## 17.3 `attendance_schedules`

```text
id
user_id
work_date
shift_template_id
location_id
status
assigned_by
created_at
updated_at
```

## 17.4 `attendance_records`

```text
id
user_id
work_date
schedule_id
check_in_at
check_out_at
check_in_method
check_out_method
check_in_location
check_out_location
check_in_media_id
check_out_media_id
late_minutes
early_checkout_minutes
status
notes
created_at
updated_at
```

Status:

```text
PRESENT
LATE
PERMISSION
SICK
ABSENT
HOLIDAY
OFF
INCOMPLETE
```

## 17.5 `attendance_requests`

```text
id
user_id
request_type
start_date
end_date
reason
evidence_media_id
status
reviewed_by
reviewed_at
review_note
created_at
```

## 17.6 `attendance_corrections`

```text
id
attendance_record_id
requested_by
reason
old_data
requested_data
status
reviewed_by
reviewed_at
created_at
```

## 17.7 `attendance_daily_activities`

Untuk monitoring kegiatan, bukan alat pengawasan berlebihan.

```text
id
user_id
work_date
work_order_id
task_id
activity_summary
output_summary
blocker
minutes_spent
created_at
updated_at
```

Pengisian dapat:

- manual;
- berasal dari task selesai;
- gabungan.

Jangan mengukur produktivitas hanya berdasarkan lama online.

---

# 18. WORKFLOW ATTENDANCE

```text
Jadwal
→ Check-in
→ Aktivitas
→ Check-out
→ Rekap
→ Koreksi bila perlu
→ Approval Supervisor
```

## 18.1 UX attendance

Mobile-first.

Halaman Today:

- nama;
- shift;
- status;
- tombol check-in;
- tombol check-out;
- keterlambatan;
- task hari ini;
- aktivitas;
- catatan.

Supervisor:

- siapa hadir;
- siapa terlambat;
- belum check-in;
- belum check-out;
- izin;
- koreksi;
- rekap.

Owner:

- ringkasan;
- bukan monitoring lokasi real-time terus-menerus;
- tidak menampilkan data pribadi yang tidak diperlukan.

---

# 19. DATABASE POS SELLER

POS Seller disiapkan untuk penjualan produk catalog.

## 19.1 `pos_seller_profiles`

```text
id
user_id
seller_code
display_name
is_active
created_at
updated_at
```

## 19.2 `pos_shifts`

```text
id
seller_user_id
opened_at
closed_at
opening_cash
closing_cash_counted
system_cash_expected
cash_difference
status
opened_by
closed_by
notes
```

Status:

```text
OPEN
CLOSED
REVIEW
```

## 19.3 `pos_customers`

```text
id
customer_code
name
phone
email
customer_type
notes
created_by
created_at
updated_at
```

## 19.4 `pos_orders`

```text
id
order_number
seller_user_id
shift_id
customer_id
order_type
status
subtotal
discount_total
tax_total
shipping_total
grand_total
paid_total
change_total
notes
created_at
completed_at
voided_at
voided_by
void_reason
```

Status:

```text
DRAFT
PENDING_PAYMENT
PAID
PARTIALLY_PAID
CANCELLED
VOID
REFUNDED
```

## 19.5 `pos_order_items`

```text
id
order_id
product_id
variant_id
product_name_snapshot
variant_name_snapshot
sku_snapshot
quantity
unit_price
discount_amount
line_total
customization_note
```

Gunakan snapshot agar histori transaksi tidak berubah saat nama produk berubah.

## 19.6 `pos_payments`

```text
id
order_id
payment_method
amount
reference_number
status
paid_at
recorded_by
notes
```

Metode awal:

```text
CASH
BANK_TRANSFER
QRIS
OTHER
```

## 19.7 `pos_cash_movements`

```text
id
shift_id
movement_type
amount
reason
created_by
created_at
```

Type:

```text
CASH_IN
CASH_OUT
```

## 19.8 Stock

Untuk fase awal:

- POS dapat menggunakan status ketersediaan sederhana;
- stock engine lengkap bukan bagian MVP;
- jangan membuat stok palsu;
- jika stock belum tersedia, gunakan:
  - available;
  - made-to-order;
  - pre-order;
  - unavailable.

Stock ledger dapat dibuat pada fase berikutnya.

---

# 20. WORKFLOW POS SELLER

```text
Login Seller
→ Buka Shift
→ Pilih Customer
→ Pilih Produk
→ Pilih Warna / Size
→ Tambah Custom Note
→ Checkout
→ Pembayaran
→ Struk
→ Order Selesai
→ Tutup Shift
→ Rekap
```

Aturan:

- seller hanya melihat transaksi sendiri kecuali memiliki `view_all`;
- void membutuhkan permission;
- transaksi tidak dihapus;
- pembayaran disimpan terpisah;
- perubahan harga harus dicatat;
- artikel belum publish tidak muncul;
- artikel inactive tidak dapat dijual baru;
- data produk pada order menggunakan snapshot.

---

# 21. UI/UX GLOBAL

## 21.1 App shell

Desktop:

- sidebar;
- topbar;
- breadcrumb;
- quick action;
- user menu;
- notification area;
- content area.

Mobile:

- bottom navigation atau drawer;
- quick action;
- touch target besar;
- table berubah menjadi card;
- tidak ada horizontal scroll kecuali data matrix penting.

## 21.2 Menu

Menu mengikuti:

- feature flag;
- permission;
- role.

Contoh:

```text
Dashboard

Product Launch
- Perintah Kerja
- Kelola & Pantau
- Supplier & Bahan
- Sampling
- HPP
- Size Chart
- QC
- Laporan

Catalog
- Produk

Attendance
- Hari Ini
- Tim
- Jadwal
- Pengajuan
- Laporan

POS Seller
- Jual
- Pesanan
- Shift
- Pelanggan
- Laporan

Pengaturan
```

## 21.3 Design principles

- informasi penting terlihat tanpa membuka banyak modal;
- form panjang dibagi tab atau step;
- status selalu memiliki label dan warna;
- warna bukan satu-satunya indikator;
- user melihat tindakan berikutnya;
- deadline jelas;
- blocker jelas;
- activity log mudah dilacak;
- mobile-first untuk attendance dan POS;
- desktop-optimized untuk Owner monitor dan HPP;
- tidak menampilkan semua field sekaligus;
- draft tersimpan;
- unsaved change warning;
- loading skeleton;
- empty state;
- error state;
- permission denied state;
- offline state bila PWA diaktifkan.

---

# 22. UI/UX PRODUCT LAUNCH

## 22.1 Dashboard

Owner:

- total artikel;
- artikel aktif;
- overdue;
- waiting review;
- blocked;
- artikel final;
- kesiapan GG Supply;
- kesiapan GUDSKUY;
- task tim;
- aktivitas;
- bottleneck;
- deadline.

Tim:

- task saya;
- deadline;
- blocked;
- review;
- update terbaru.

## 22.2 Perintah Kerja

View:

- kanban;
- table;
- compact list.

Filter:

- brand;
- stage;
- PIC;
- status;
- deadline;
- priority;
- category.

Quick actions:

- update status;
- add note;
- upload;
- add task;
- request review.

## 22.3 Detail Artikel

Header:

- brand;
- code;
- name;
- status;
- progress;
- target;
- PIC;
- actions.

Tab:

1. Overview
2. Workflow
3. Task
4. Material
5. Supplier
6. Color
7. Sample
8. HPP
9. Size Chart
10. QC
11. Media
12. Activity

## 22.4 HPP UX

- line item;
- quantity;
- unit;
- unit price;
- total;
- source;
- category;
- add/remove row;
- subtotal;
- reject;
- overhead;
- HPP;
- margin;
- suggested price;
- compare version;
- finalize.

## 22.5 Sampling UX

- version timeline;
- photo grid;
- measurement;
- review;
- revision;
- approve master;
- comparison between versions.

## 22.6 Size chart UX

- dynamic size columns;
- dynamic measurement rows;
- tolerance;
- copy from sample;
- version;
- review;
- final.

---

# 23. VALIDASI DAN GATE

## 23.1 Artikel tidak dapat final jika:

- brief belum lengkap;
- material belum approved;
- supplier belum approved;
- warna belum final;
- master sample belum ada;
- HPP final belum ada;
- size chart final belum ada;
- QC wajib belum pass;
- dokumentasi wajib belum lengkap;
- Owner belum approve.

## 23.2 Publish tidak dapat dilakukan jika:

- artikel belum approved;
- product code duplicate;
- variant invalid;
- harga belum tersedia;
- catalog payload tidak lengkap.

## 23.3 POS tidak dapat menjual jika:

- produk inactive;
- variant inactive;
- shift belum dibuka;
- seller tidak memiliki permission;
- grand total invalid.

## 23.4 Attendance tidak dapat:

- check-out sebelum check-in;
- check-in dua kali;
- mengubah record final tanpa correction request;
- approve correction sendiri kecuali Owner override.

---

# 24. REALTIME DAN NOTIFIKASI

Realtime tidak wajib pada MVP.

Jika diaktifkan, gunakan pada:

- work order;
- stage update;
- task assignment;
- attendance status;
- POS order status.

Notifikasi:

- assignment;
- deadline mendekat;
- overdue;
- review request;
- revision;
- approval;
- attendance missing;
- POS shift belum ditutup.

Gunakan notification center internal terlebih dahulu.

Push notification dapat menjadi fase berikutnya.

---

# 25. MEDIA

Pilih satu provider utama.

## 25.1 Cloudinary

Cocok untuk:

- foto;
- transformasi;
- thumbnail;
- katalog.

## 25.2 Supabase Storage

Cocok untuk:

- PDF;
- dokumen;
- file internal;
- signed URL.

Keputusan yang direkomendasikan:

- Cloudinary untuk image asset;
- Supabase Storage untuk dokumen internal;

atau gunakan satu provider jika kesederhanaan lebih penting.

Buat adapter agar provider dapat diganti.

Folder:

```text
launch/
  gg-supply/
  gudskuy/

attendance/
  evidence/

pos/
  receipts/

catalog/
```

---

# 26. SECURITY

## 26.1 Authentication

- Supabase Auth;
- email/password;
- optional magic link;
- session refresh;
- logout all session untuk Owner;
- inactive profile ditolak.

## 26.2 Authorization

- RLS wajib;
- permission helper;
- frontend guard;
- service validation;
- read scope;
- write scope.

## 26.3 Secret

Dilarang di client:

- service role;
- database password;
- Cloudinary secret;
- private API key.

## 26.4 Audit

Log:

- create;
- update;
- assign;
- stage transition;
- finalization;
- approval;
- publish;
- void;
- correction;
- permission change.

## 26.5 Privacy Attendance

- GPS dan selfie default off;
- aktif hanya bila ada kebijakan;
- jelaskan data yang dikumpulkan;
- batasi akses;
- hindari tracking kontinu.

---

# 27. RLS RULE RINGKAS

## Product Launch

User dapat membaca jika:

- Owner;
- `view_all`;
- creator;
- PIC;
- member;
- assigned task/stage.

User dapat mengubah hanya domain sesuai permission.

## Attendance

User dapat membaca data sendiri.

Supervisor dapat membaca tim.

Owner dapat membaca seluruh.

Koreksi membutuhkan reviewer.

## POS

Seller dapat membaca order sendiri.

Manager/Owner dapat membaca seluruh.

Void membutuhkan permission.

## Audit

Client tidak dapat update/delete.

---

# 28. REPORTING

## 28.1 Launch

- artikel per stage;
- average stage duration;
- overdue;
- blocker;
- supplier lead time;
- HPP changes;
- sample revisions;
- readiness;
- productivity output.

## 28.2 Attendance

- hadir;
- terlambat;
- izin;
- sakit;
- tidak hadir;
- incomplete record;
- monthly summary.

## 28.3 POS

- sales;
- order;
- payment;
- seller;
- shift;
- product;
- average transaction;
- void;
- cash difference.

Jangan menilai karyawan hanya dari satu metrik.

---

# 29. IMPLEMENTATION PHASE

## Phase 0 — Architecture

Output:

- docs;
- ERD;
- UI map;
- role matrix;
- implementation plan.

## Phase 1 — Foundation

- repo;
- auth;
- database;
- profile;
- role;
- permission;
- RLS;
- media;
- audit;
- app shell;
- settings.

## Phase 2 — Launch Core

- brand;
- work order;
- stage;
- task;
- monitoring;
- activity.

## Phase 3 — Product Development

- material;
- supplier;
- color;
- sample;
- HPP;
- size chart;
- QC;
- approval.

## Phase 4 — Catalog

- publish;
- product;
- variant;
- price;
- customization capability.

## Phase 5 — Attendance

- schedule;
- check-in/out;
- request;
- correction;
- report.

## Phase 6 — POS Seller

- shift;
- cart;
- order;
- payment;
- receipt;
- report.

## Phase 7 — Optimization

- PWA;
- realtime;
- notification;
- analytics;
- export;
- backup;
- performance.

---

# 30. PRIORITAS 60 HARI

## Hari 1–7

- architecture;
- scaffold;
- Supabase;
- auth;
- RLS;
- core UI;
- user;
- role;
- permission.

## Hari 8–18

- work order;
- workflow;
- task;
- dashboard;
- monitoring Owner.

## Hari 19–32

- material;
- supplier;
- color;
- sampling;
- media.

## Hari 33–43

- HPP;
- size chart;
- QC;
- approval.

## Hari 44–50

- catalog;
- publish;
- product;
- variant.

## Hari 51–55

- attendance foundation;
- route;
- schema;
- permission;
- UI placeholder atau MVP sederhana.

## Hari 56–60

- POS foundation;
- route;
- schema;
- permission;
- UI placeholder;
- testing;
- stabilization;
- UAT.

Attendance dan POS tidak wajib full production dalam 60 hari.

Yang wajib:

- schema matang;
- module boundary;
- permission;
- route;
- feature flag;
- fondasi implementasi.

---

# 31. TEST PLAN

## Unit

- HPP;
- progress;
- gate;
- permission;
- overdue;
- size chart;
- publish idempotency;
- POS total;
- attendance status.

## Integration

- auth;
- RLS;
- create work order;
- assignment;
- stage update;
- supplier approval;
- HPP finalize;
- sample approve;
- size chart finalize;
- QC;
- article approve;
- publish;
- attendance check-in;
- POS shift/order/payment.

## E2E

1. Owner membuat user.
2. Owner memberi role.
3. Owner membuat perintah.
4. Dodi mengelola bahan/HPP.
5. Yadi mengelola sampel/size.
6. Syaikhu mengelola supplier.
7. QC pass.
8. Owner approve.
9. Publish catalog.
10. Seller menjual produk.
11. Owner melihat report.

## Security

- non-member read denied;
- permission denied;
- service role tidak bocor;
- inactive user denied;
- final version immutable;
- void protected;
- correction protected.

---

# 32. DEPLOYMENT

Gunakan:

- GitHub repository baru;
- Supabase project baru;
- Vercel project baru;
- preview deployment;
- production deployment;
- environment terpisah.

Environment:

```text
Local
Preview
Production
```

Migration:

- local;
- preview;
- backup;
- production.

Feature flag:

- Attendance off;
- POS off;
- Product Launch on setelah UAT.

---

# 33. BACKUP DAN RECOVERY

- database backup;
- migration version control;
- media backup policy;
- export JSON/CSV untuk data penting;
- restore test;
- rollback deployment;
- audit retention.

Jangan mengandalkan provider backup tanpa dokumentasi restore.

---

# 34. PERFORMANCE

- pagination;
- index;
- filtered query;
- query cache;
- image thumbnail;
- lazy route;
- avoid realtime berlebihan;
- avoid N+1;
- database view untuk monitoring;
- debounced search;
- optimistic update hanya jika aman.

---

# 35. ACCEPTANCE CRITERIA

System diterima bila:

1. Berdiri sendiri.
2. Tidak bergantung GarSys Pro.
3. Auth sendiri.
4. Database sendiri.
5. Deployment sendiri.
6. GG Supply dan GUDSKUY tersedia.
7. Work order dapat dibuat.
8. Creator permission dapat diatur.
9. Owner melihat seluruh task.
10. Tim melihat assigned scope.
11. Workflow delapan tahap berjalan.
12. Task dan stage sinkron.
13. Supplier dan material tersedia.
14. Sampling versioned.
15. HPP versioned.
16. Size chart dinamis.
17. QC gate.
18. Approval Owner.
19. Publish catalog idempotent.
20. Attendance terisolasi.
21. POS terisolasi.
22. Feature flag.
23. RLS.
24. Audit.
25. Responsive.
26. Test.
27. Build sukses.
28. Tidak ada secret.
29. Backup plan.
30. Dokumentasi lengkap.

---

# 36. OUTPUT WAJIB AI SEBELUM CODING

AI harus menyusun:

## A. Technology Decision Record

```text
Frontend:
Routing:
State:
Query:
Form:
Validation:
Database:
Auth:
Storage:
Hosting:
Testing:
PWA:
```

## B. Module Map

```text
Core
Launch
Catalog
Attendance
POS
Reporting
Settings
```

## C. ERD

Mermaid atau diagram.

## D. Route Map

Per role.

## E. Permission Matrix

Role × Permission.

## F. UI Flow

- Owner;
- Product Lead;
- Production;
- Sourcing;
- Seller;
- Attendance user.

## G. Implementation Plan

File, migration, test, deployment.

## H. Risks

- scope;
- security;
- data;
- UI;
- performance;
- adoption.

---

# 37. PROMPT LANJUTAN

## Setelah planning disetujui

```text
LANJUT BANGUN FONDASI GG PRODUCT OS.

Gunakan blueprint.md dan dokumen arsitektur yang sudah disetujui.

Project harus berdiri sendiri dan tidak terhubung ke GarSys Pro.

Kerjakan:
1. scaffold;
2. Supabase;
3. migration core;
4. auth;
5. profile;
6. role;
7. permission;
8. RLS;
9. audit;
10. media adapter;
11. app shell;
12. feature flags;
13. test.

Jangan mulai Product Launch sebelum fondasi selesai dan diuji.

Laporkan file, migration, RLS, test, build, risiko, dan rollback.
```

## Setelah fondasi selesai

```text
LANJUT PRODUCT LAUNCH MVP.

Implementasikan secara bertahap:
1. brand;
2. work order;
3. stage;
4. task;
5. Owner monitor;
6. material;
7. supplier;
8. color;
9. sample;
10. HPP;
11. size chart;
12. QC;
13. approval;
14. catalog publish.

Attendance dan POS tetap feature flag OFF.

Setelah setiap batch:
- test;
- build;
- permission test;
- mobile test;
- laporan perubahan.
```

## Menyiapkan Attendance

```text
SIAPKAN MODUL ATTENDANCE.

Aktifkan hanya pada preview.
Jangan mengubah workflow Product Launch.

Implementasikan:
- shift template;
- schedule;
- check-in;
- check-out;
- request;
- correction;
- daily activity;
- team monitoring;
- report dasar;
- RLS;
- mobile UX.

GPS dan selfie tetap OFF.
```

## Menyiapkan POS Seller

```text
SIAPKAN MODUL POS SELLER.

Aktifkan hanya pada preview.
Produk hanya berasal dari Catalog yang ACTIVE dan is_sellable=true.

Implementasikan:
- seller profile;
- open shift;
- customer;
- cart;
- order;
- payment;
- receipt;
- close shift;
- report dasar;
- RLS;
- touch-friendly mobile/tablet UX.

Jangan membangun stock ledger lengkap pada tahap ini.
```

---

# 38. CATATAN TENTANG PROTOTYPE HTML

Prototype sebelumnya boleh digunakan untuk referensi:

- layout;
- navigation;
- kanban;
- monitoring;
- HPP interaction;
- sample timeline;
- size chart;
- access settings.

Tidak boleh disalin:

- localStorage;
- user switch tanpa auth;
- permission frontend-only;
- hardcoded data;
- direct mutation;
- URL file tanpa validation;
- single-file architecture.

---

# 39. DEFINITION OF DONE

Fitur selesai jika:

- kebutuhan terpenuhi;
- migration tersedia;
- RLS tersedia;
- repository/service tersedia;
- validation tersedia;
- loading tersedia;
- empty tersedia;
- error tersedia;
- permission denied tersedia;
- mobile diperiksa;
- desktop diperiksa;
- unit test;
- integration test;
- build;
- lint;
- documentation;
- audit;
- rollback;
- no secret;
- no uncontrolled dependency.

---

# 40. PENUTUP

GG Product OS harus dibangun sebagai sistem operasional mandiri yang berfokus pada kualitas proses pengembangan artikel.

Product Launch adalah inti.

Attendance membantu kontrol kehadiran dan aktivitas.

POS Seller membantu transaksi produk yang sudah siap dijual.

Ketiga modul berada dalam satu aplikasi baru dan satu database baru, tetapi tetap dipisahkan melalui module boundaries, permission, route, database table group, feature flag, dan service layer.

Sistem harus dapat tumbuh tanpa mengorbankan kestabilan modul utama.

**Akhir blueprint.**
