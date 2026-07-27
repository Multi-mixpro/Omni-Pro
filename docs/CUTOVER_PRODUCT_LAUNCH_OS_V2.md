# Cutover Product Launch OS V2

Dokumen ini adalah satu-satunya runbook cutover untuk versi baru.

## 1. Backup sebelum reset

Reset migration bersifat destruktif untuk tabel aplikasi pada schema `public`. Supabase Auth, user login, Storage internal, dan schema sistem Supabase tidak dihapus.

Sebelum menerapkan migration:

1. ekspor data lama yang masih ingin disimpan;
2. hentikan input di aplikasi versi lama;
3. pastikan daftar user Auth sudah benar;
4. simpan salinan environment Vercel production;
5. jalankan `supabase/migrations/20260726005000_backup_public_before_reset.sql`.

Migration backup menyalin seluruh data tabel `public` ke schema `legacy_backup_20260727` dan menyimpan definisi view, function, serta policy. Schema `auth`, `storage`, dan schema internal Supabase tidak disentuh.

## 2. Terapkan schema baru

Jalankan migration berikut pada project Supabase yang sudah terhubung:

`supabase/migrations/20260726010000_product_launch_os_reset.sql`

Pilihan penerapan:

- Supabase CLI `db push` jika project sudah di-link dan migration history lokal tersedia; atau
- salin isi migration ke Supabase SQL Editor lalu jalankan satu kali.

Jika migration dijalankan melalui SQL Editor, tandai versi `20260726005000` dan `20260726010000` sebagai `applied` menggunakan `supabase migration repair` setelah project CLI di-link. Reset memiliki guard yang akan berhenti jika schema v2 sudah terpasang, sehingga tidak dapat menghapus ulang database secara tidak sengaja.

Migration reset akan:

- menghapus seluruh tabel, view, function/procedure, dan sequence lama pada schema `public`;
- mempertahankan `auth.users`;
- membuat profil dari user Auth yang sudah ada;
- membuat role untuk Gugun, Dodi, Syaikhu, dan Yadi berdasarkan nama/username;
- menetapkan user Auth paling awal sebagai owner jika nama Gugun tidak terdeteksi;
- membuat tabel, RLS, permission, workflow, dan gate baru.

Setelah reset, jalankan `supabase/migrations/20260727020000_team_user_provisioning.sql`. Migration ini membuat allowlist undangan tim, trigger Auth, provisioning profil otomatis, role fallback `product_team`, dan RLS khusus owner untuk pengelolaan undangan.

## 3. Periksa role setelah migration

Pastikan pembagian awal:

| Anggota | Role default |
|---|---|
| Gugun | `owner` |
| Dodi | `product_lead` |
| Syaikhu | `sourcing_lead` |
| Yadi | `production_qc` |

Jika metadata nama pada Supabase Auth berbeda, koreksi `user_roles` sebelum aplikasi dibuka untuk tim.

## 4. Environment Vercel

Public browser variables:

- `VITE_SUPABASE_URL`;
- `VITE_SUPABASE_ANON_KEY`;
- `VITE_CLOUDINARY_CLOUD_NAME`;
- `VITE_APP_ENV=production`;
- `VITE_ENABLE_PRODUCT_LAUNCH=true`;
- `VITE_ENABLE_ATTENDANCE=false`;
- `VITE_ENABLE_POS_SELLER=false`.

Server-only variables:

- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `CLOUDINARY_CLOUD_NAME`;
- `CLOUDINARY_API_KEY`;
- `CLOUDINARY_API_SECRET`.

Jangan menggunakan `SUPABASE_SERVICE_ROLE_KEY` atau `CLOUDINARY_API_SECRET` pada variable yang diawali `VITE_`.

## 5. Validasi setelah deploy

1. login dengan username/email tim;
2. buat artikel uji untuk GG Supply;
3. upload gambar referensi;
4. cek folder Cloudinary `gg-indo-apparel/product-launch/{project_id}`;
5. cek sembilan stage dan delapan task otomatis;
6. login sebagai tiap anggota dan cek akses;
7. tandai task uji selesai;
8. pastikan gate menolak tahap selesai ketika data wajib belum ada;
9. arsipkan artikel uji setelah validasi.

## 6. Kondisi koneksi saat blueprint dibuat

- Project Supabase yang sama dapat dibaca dengan kredensial server.
- Tabel lama yang terdeteksi: profil/role/permission, launch work order/stage/task, media, audit, dan simulation state.
- Konfigurasi lokal sudah menggunakan publishable key baru; metadata schema tetap tidak dapat dibaca dengan key publik, sesuai pembatasan Supabase.
- Workspace lokal belum memiliki link CLI ke Vercel atau Supabase, sehingga reset remote dan deploy production tidak dilakukan otomatis dari workspace ini.
