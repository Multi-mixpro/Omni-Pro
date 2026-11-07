import { authorizeTeamAdmin } from '../server/teamAdmin.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const INTERNAL_DOMAIN = 'team.ggindoapparel.internal';
const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/;
const PASSWORD_MIN_LENGTH = 6;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authorized = await authorizeTeamAdmin(req, res);
  if (!authorized) return;
  const { admin, user } = authorized;

  const targetId = String(req.body?.user_id ?? '').trim();
  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const fullName = String(req.body?.full_name ?? '').trim();
  const jobTitle = String(req.body?.job_title ?? '').trim();
  const roleCode = String(req.body?.role_code ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '').trim();

  if (!targetId) return res.status(400).json({ error: 'user_id wajib diisi.' });
  if (!USERNAME_PATTERN.test(username)) return res.status(400).json({ error: 'Username 3-40 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip.' });
  if (!fullName) return res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
  if (!roleCode) return res.status(400).json({ error: 'Role wajib dipilih.' });
  if (password && password.length < PASSWORD_MIN_LENGTH) {
    return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
  }

  const [{ data: profile, error: profileError }, { data: roleRow, error: roleError }, { data: currentRoles, error: currentRolesError }, { data: duplicateUsername, error: duplicateUsernameError }] = await Promise.all([
    admin.from('profiles').select('id, username, is_active').eq('id', targetId).maybeSingle(),
    admin.from('roles').select('id, code, name').eq('code', roleCode).maybeSingle(),
    admin.from('user_roles').select('role:roles(code)').eq('user_id', targetId),
    admin.from('profiles').select('id').eq('username', username).neq('id', targetId).maybeSingle(),
  ]);

  if (profileError) return res.status(500).json({ error: 'Gagal memeriksa data pengguna.' });
  if (!profile) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });
  if (roleError) return res.status(500).json({ error: 'Gagal memeriksa role.' });
  if (!roleRow) return res.status(400).json({ error: 'Role tidak dikenal.' });
  if (currentRolesError) return res.status(500).json({ error: 'Gagal memeriksa role aktif pengguna.' });
  if (duplicateUsernameError) return res.status(500).json({ error: 'Gagal memeriksa ketersediaan username.' });
  if (duplicateUsername) return res.status(409).json({ error: 'Username sudah dipakai pengguna lain.' });

  const currentRoleCode = ((currentRoles ?? []) as Array<{ role?: { code?: string } | null }>)
    .find(item => item.role?.code)?.role?.code ?? null;
  if (targetId === user.id && currentRoleCode && currentRoleCode !== roleCode) {
    return res.status(400).json({ error: 'Role akun sendiri tidak dapat diubah dari halaman ini.' });
  }

  const nextEmail = `${username}@${INTERNAL_DOMAIN}`;
  const { error: authUpdateError } = await admin.auth.admin.updateUserById(targetId, {
    email: nextEmail,
    ...(password ? { password } : {}),
    user_metadata: {
      full_name: fullName,
      username,
      job_title: jobTitle || null,
    },
    email_confirm: true,
  });
  if (authUpdateError) {
    return res.status(400).json({ error: authUpdateError.message || 'Gagal memperbarui login pengguna.' });
  }

  const { error: profileUpdateError } = await admin
    .from('profiles')
    .update({ username, full_name: fullName, job_title: jobTitle || null })
    .eq('id', targetId);
  if (profileUpdateError) return res.status(500).json({ error: 'Gagal memperbarui profil pengguna.' });

  const { error: roleUpdateError } = await admin.rpc('replace_workspace_user_role', { p_user: targetId, p_role: roleRow.id });
  if (roleUpdateError) return res.status(500).json({ error: 'Gagal mengganti role pengguna. Role sebelumnya tetap berlaku.' });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    id: targetId,
    username,
    full_name: fullName,
    job_title: jobTitle || null,
    role_code: roleRow.code,
    role_name: roleRow.name,
    is_active: profile.is_active,
  });
}
