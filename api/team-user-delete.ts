import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'node:crypto';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DELETED_DOMAIN = 'deleted.ggindoapparel.internal';

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
  if (permissionError || !allowed) return res.status(403).json({ error: 'Hanya owner/admin yang dapat menghapus pengguna' });

  const targetId = String(req.body?.user_id ?? '').trim();
  if (!targetId) return res.status(400).json({ error: 'user_id wajib diisi.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, username, full_name')
    .eq('id', targetId)
    .maybeSingle();
  if (profileError) return res.status(500).json({ error: 'Gagal memeriksa data pengguna.' });
  if (!profile) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

  const deletedUsername = `deleted_${targetId.replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  const deletedEmail = `${deletedUsername}@${DELETED_DOMAIN}`;
  const deletedPassword = `${randomUUID()}${randomUUID()}`;

  const [
    authUpdate,
    roleDelete,
    overrideDelete,
    memberDelete,
    profileUpdate,
  ] = await Promise.all([
    admin.auth.admin.updateUserById(targetId, {
      email: deletedEmail,
      password: deletedPassword,
      user_metadata: {
        deleted_at: new Date().toISOString(),
        deleted_from_launch: true,
        previous_username: profile.username,
        previous_full_name: profile.full_name,
      },
      email_confirm: true,
    }),
    admin.from('user_roles').delete().eq('user_id', targetId),
    admin.from('user_permission_overrides').delete().eq('user_id', targetId),
    admin.from('launch_project_members').delete().eq('user_id', targetId),
    admin
      .from('profiles')
      .update({
        username: deletedUsername,
        full_name: `[Deleted] ${profile.full_name}`,
        job_title: null,
        avatar_url: null,
        is_active: false,
      })
      .eq('id', targetId),
  ]);

  if (authUpdate.error) return res.status(500).json({ error: authUpdate.error.message || 'Gagal menonaktifkan login pengguna.' });
  if (roleDelete.error) return res.status(500).json({ error: 'Gagal membersihkan role pengguna.' });
  if (overrideDelete.error) return res.status(500).json({ error: 'Gagal membersihkan override izin pengguna.' });
  if (memberDelete.error) return res.status(500).json({ error: 'Gagal membersihkan akses artikel pengguna.' });
  if (profileUpdate.error) return res.status(500).json({ error: 'Gagal menandai pengguna sebagai dihapus.' });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ id: targetId, deleted: true, deleted_self: targetId === userData.user.id });
}
