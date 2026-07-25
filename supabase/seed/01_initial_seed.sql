-- Seed Roles
INSERT INTO public.roles (code, name, description, is_system)
VALUES
  ('owner', 'Owner', 'Akses penuh ke seluruh sistem dan konfigurasi', true),
  ('product_lead', 'Product Lead', 'Mengelola brief artikel, riset bahan, supplier, dan HPP', true),
  ('production_lead', 'Production Lead', 'Mengelola sampel, size chart, dan Quality Control teknis', true),
  ('sourcing_admin', 'Sourcing & Production Admin', 'Mengelola supplier, quote harga, dan aksesori', true),
  ('creative', 'Creative', 'Mengelola media visual, foto sampel, dan konten katalog', true),
  ('qc', 'Quality Control', 'Pemeriksaan checklist QC dan persetujuan teknis', true),
  ('seller', 'Seller', 'Kasir POS Seller dan pengelolaan transaksi order', true),
  ('attendance_supervisor', 'Attendance Supervisor', 'Pengelolaan jadwal shift dan koreksi absensi', true),
  ('viewer', 'Viewer', 'Akses baca-saja ke modul yang ditentukan', true)
ON CONFLICT (code) DO NOTHING;

-- Seed Feature Flags
INSERT INTO public.feature_flags (code, is_enabled, description)
VALUES
  ('PRODUCT_LAUNCH', true, 'Modul utama pengembangan dan launching artikel produk'),
  ('CATALOG', true, 'Modul katalog produk internal dan publikasi'),
  ('ATTENDANCE', false, 'Modul absensi dan jadwal karyawan'),
  ('POS_SELLER', false, 'Modul penjualan kasir POS Seller'),
  ('REALTIME', false, 'Fitur pembaruan realtime Supabase'),
  ('PWA', false, 'Fitur Progressive Web App')
ON CONFLICT (code) DO NOTHING;

-- Seed Brands
INSERT INTO public.permissions (code, module, description)
VALUES
  ('core.users.view', 'core', 'Melihat daftar pengguna'),
  ('core.users.manage', 'core', 'Mengelola pengguna dan aktivasi profil'),
  ('core.roles.view', 'core', 'Melihat daftar role'),
  ('core.roles.manage', 'core', 'Menetapkan role pengguna'),
  ('core.features.manage', 'core', 'Mengelola feature flags'),
  ('core.audit.view', 'core', 'Melihat log audit sistem'),
  ('launch.dashboard.view', 'launch', 'Melihat dashboard launching'),
  ('launch.work_order.view_all', 'launch', 'Melihat seluruh perintah kerja artikel'),
  ('launch.work_order.view_assigned', 'launch', 'Melihat perintah kerja yang ditugaskan'),
  ('launch.work_order.create', 'launch', 'Membuat perintah kerja artikel baru'),
  ('launch.work_order.edit', 'launch', 'Mengubah data perintah kerja'),
  ('launch.hpp.manage', 'launch', 'Mengelola dan mengalkulasi HPP'),
  ('launch.hpp.finalize', 'launch', 'Memfinalisasi HPP artikel'),
  ('launch.sample.manage', 'launch', 'Mengelola iterasi sampel artikel'),
  ('launch.qc.manage', 'launch', 'Mengisi checklist QC artikel'),
  ('launch.article.approve', 'launch', 'Menyetujui artikel final (Owner)'),
  ('launch.article.publish', 'launch', 'Mempublikasikan artikel ke katalog')
ON CONFLICT (code) DO NOTHING;
