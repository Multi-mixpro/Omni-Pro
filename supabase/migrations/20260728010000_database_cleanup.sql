-- Database cleanup: hapus schema backup, data uji, dan tabel master yang akan didesain ulang

begin;

-- 1. Hapus schema backup lama beserta semua isinya
drop schema if exists legacy_backup_20260727 cascade;

-- 2. Hapus semua data uji launch (cascade ke stage_runs, tasks, activity, dll)
truncate table public.launch_projects cascade;

-- 3. Bersihkan tabel master yang akan didesain ulang
truncate table public.materials cascade;
truncate table public.suppliers cascade;

commit;
