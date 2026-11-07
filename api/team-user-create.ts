import { authorizeTeamAdmin } from '../server/teamAdmin.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Team members sign in with a username, so Auth still needs an address.
const INTERNAL_DOMAIN = 'team.ggindoapparel.internal';
const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/;
const PIN_PATTERN = /^\d{6,12}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authorized = await authorizeTeamAdmin(req, res);
  if (!authorized) return;
  const { admin } = authorized;

  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const pin = String(req.body?.pin ?? '').trim();
  const fullName = String(req.body?.full_name ?? '').trim();
  const jobTitle = String(req.body?.job_title ?? '').trim();
  const roleCode = String(req.body?.role_code ?? '').trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) return res.status(400).json({ error: 'Username 3-40 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip.' });
  if (!PIN_PATTERN.test(pin)) return res.status(400).json({ error: 'PIN harus 6-12 digit angka.' });
  if (!fullName) return res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
  if (!roleCode) return res.status(400).json({ error: 'Role wajib dipilih.' });

  const { data: roleRow, error: roleError } = await admin.from('roles').select('id, code').eq('code', roleCode).maybeSingle();
  if (roleError) return res.status(500).json({ error: 'Gagal memeriksa role.' });
  if (!roleRow) return res.status(400).json({ error: 'Role tidak dikenal.' });

  const email = `${username}@${INTERNAL_DOMAIN}`;

  const { data: existingProfile, error: lookupError } = await admin.from('profiles')
    .select('id').eq('username', username).maybeSingle();
  if (lookupError) return res.status(500).json({ error: 'Gagal memeriksa username.' });
  if (existingProfile) return res.status(409).json({ error: 'Username sudah digunakan. Pilih username lain atau edit akun yang ada.' });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    app_metadata: { app_role: roleRow.code },
    user_metadata: { full_name: fullName, username, job_title: jobTitle || null },
  });

  if (createError || !created.user) {
    if (createError?.code === 'email_exists' || createError?.code === 'user_already_exists') {
      return res.status(409).json({ error: 'Username sudah terdaftar di autentikasi. Gunakan username lain.' });
    }
    return res.status(400).json({ error: createError?.message ?? 'Pengguna gagal dibuat di Supabase Auth.' });
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from('profiles').upsert({
    id: userId,
    username,
    full_name: fullName,
    job_title: jobTitle || null,
    is_active: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return res.status(500).json({ error: 'Gagal membuat profil pengguna.' });
  }

  const { error: assignmentError } = await admin.rpc('replace_workspace_user_role', { p_user: userId, p_role: roleRow.id });
  if (assignmentError) {
    await admin.from('profiles').update({ is_active: false }).eq('id', userId);
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    return res.status(500).json({ error: 'Gagal menetapkan role pengguna. Akun baru tidak diaktifkan.' });
  }

  return res.status(201).json({ id: userId, username, email, full_name: fullName, role_code: roleCode });
}
