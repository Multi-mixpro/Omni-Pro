import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase khusus Presensi.
 *
 * Diarahkan ke schema `presensi`, BUKAN `public`.
 *
 * Ini bukan sekadar preferensi: nama business_units dan audit_logs sudah
 * dipakai Product Launch OS, dan public.business_units dirujuk foreign key oleh
 * launch_projects. Ketika modul ini sempat diarahkan ke `public`, skema
 * presensi menimpa tabel Product Launch sehingga unit bisnis artikel hilang
 * dan foreign key-nya terhapus. Jangan ubah kembali ke `public`.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('[Presensi] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum dikonfigurasi.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    db: { schema: 'presensi' },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Dibedakan agar sesi Presensi dan Product Launch tidak saling menimpa
      // pada perangkat yang sama.
      storageKey: 'gg-presensi-auth',
    },
  },
);
