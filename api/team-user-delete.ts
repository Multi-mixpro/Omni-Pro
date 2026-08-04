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

  // 1. Rename profile username FIRST to release the UNIQUE constraint index immediately
  await admin.from('profiles').update({ username: deletedUsername, is_active: false }).eq('id', targetId);

  // 2. Delete dependent tables & FK references
  await admin.from('team_invites').delete().or(`username.eq.${profile.username},email.eq.${profile.username}@team.ggindoapparel.internal`);
  await admin.from('user_roles').delete().eq('user_id', targetId);
  await admin.from('user_permission_overrides').delete().eq('user_id', targetId);
  await admin.from('launch_project_members').delete().eq('user_id', targetId);
  await admin.from('launch_projects').update({ created_by: null }).eq('created_by', targetId);
  await admin.from('launch_projects').update({ owner_id: null }).eq('owner_id', targetId);

  // 3. Hard delete profile from profiles table
  await admin.from('profiles').delete().eq('id', targetId);
  // Also clean up any orphaned deleted_ profiles
  await admin.from('profiles').delete().or('is_active.eq.false,username.ilike.deleted_%');

  // 3. Delete from Auth or update auth user email
  const authDeleteRes = await admin.auth.admin.deleteUser(targetId);
  if (authDeleteRes.error) {
    await admin.auth.admin.updateUserById(targetId, {
      email: deletedEmail,
      password: `${randomUUID()}${randomUUID()}`,
      user_metadata: {
        deleted_at: new Date().toISOString(),
        deleted_from_launch: true,
        previous_username: profile.username,
      },
      email_confirm: true,
    });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ id: targetId, deleted: true, deleted_self: targetId === userData.user.id });
}
