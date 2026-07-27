import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Konfigurasi Supabase belum lengkap' });
  if (!serviceRoleKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di server' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan' });

  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return res.status(401).json({ error: 'Sesi tidak valid' });
  const { data: allowed, error: permissionError } = await caller.rpc('has_permission', { permission_code: 'launch.admin' });
  if (permissionError || !allowed) return res.status(403).json({ error: 'Hanya owner/admin yang dapat menonaktifkan pengguna' });

  const targetId = String(req.body?.user_id ?? '').trim();
  if (!targetId) return res.status(400).json({ error: 'user_id wajib diisi.' });
  if (targetId === userData.user.id) return res.status(400).json({ error: 'Tidak dapat menonaktifkan akun sendiri.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Work history stays attached to the profile, so access is revoked by
  // deactivating rather than deleting the person.
  const { error } = await admin.from('profiles').update({ is_active: false }).eq('id', targetId);
  if (error) return res.status(500).json({ error: 'Gagal menonaktifkan pengguna.' });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ id: targetId, is_active: false });
}
