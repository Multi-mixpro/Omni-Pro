import { createClient } from '@supabase/supabase-js';

/**
 * Client Supabase khusus Presensi.
 *
 * Menggunakan schema `public` tempat tabel-tabel presensi (business_units, shifts,
 * employees, attendance_records, audit_logs) berada.
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
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'gg-presensi-auth',
    },
  },
);
