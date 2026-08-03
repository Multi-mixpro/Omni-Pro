import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase khusus Presensi.
 *
 * Memakai project Supabase yang SAMA dengan Product Launch OS, tetapi
 * diarahkan ke schema `presensi` sehingga tabelnya benar-benar terpisah dari
 * `public` milik Product Launch. Pemisahan di level schema dipilih karena nama
 * seperti business_units dan audit_logs sudah dipakai Product Launch —
 * business_units bahkan dirujuk foreign key oleh launch_projects.
 *
 * Sesi login tetap satu kolam auth.users (batasan Supabase: satu sistem auth
 * per project), namun hak akses ditentukan terpisah lewat presensi.memberships.
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
      // Kunci penyimpanan dibedakan agar sesi Presensi dan Product Launch
      // tidak saling menimpa pada perangkat yang sama.
      storageKey: 'gg-presensi-auth',
    },
  },
);
