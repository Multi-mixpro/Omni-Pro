import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Team members sign in with a username, so Auth still needs an address.
const INTERNAL_DOMAIN = 'team.ggindoapparel.internal';
const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/;
const PIN_PATTERN = /^\d{6,12}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Konfigurasi Supabase belum lengkap' });
  if (!serviceRoleKey) return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diset di server' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan' });

  // The caller's own token decides whether they may manage the team.
  const caller = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await caller.auth.getUser();
  if (userError || !userData.user) return res.status(401).json({ error: 'Sesi tidak valid' });

  const { data: allowed, error: permissionError } = await caller.rpc('has_permission', { permission_code: 'launch.admin' });
  if (permissionError || !allowed) return res.status(403).json({ error: 'Hanya owner/admin yang dapat membuat pengguna' });

  const username = String(req.body?.username ?? '').trim().toLowerCase();
  const pin = String(req.body?.pin ?? '').trim();
  const fullName = String(req.body?.full_name ?? '').trim();
  const jobTitle = String(req.body?.job_title ?? '').trim();
  const roleCode = String(req.body?.role_code ?? '').trim().toLowerCase();

  if (!USERNAME_PATTERN.test(username)) return res.status(400).json({ error: 'Username 3-40 karakter, hanya huruf kecil, angka, titik, garis bawah, atau strip.' });
  if (!PIN_PATTERN.test(pin)) return res.status(400).json({ error: 'PIN harus 6-12 digit angka.' });
  if (!fullName) return res.status(400).json({ error: 'Nama lengkap wajib diisi.' });
  if (!roleCode) return res.status(400).json({ error: 'Role wajib dipilih.' });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: roleRow, error: roleError } = await admin.from('roles').select('id, code').eq('code', roleCode).maybeSingle();
  if (roleError) return res.status(500).json({ error: 'Gagal memeriksa role.' });
  if (!roleRow) return res.status(400).json({ error: 'Role tidak dikenal.' });

  const email = `${username}@${INTERNAL_DOMAIN}`;

  // Check if caller is trying to overwrite their own active login account
  const { data: callerProfile } = await admin.from('profiles').select('username').eq('id', userData.user.id).maybeSingle();
  if (callerProfile?.username?.toLowerCase() === username) {
    return res.status(400).json({ error: 'Tidak dapat membuat ulang akun yang sedang digunakan untuk login saat ini.' });
  }

  // 1. Release UNIQUE constraint on any existing profile matching this username by renaming it first!
  const { data: existingProfiles } = await admin
    .from('profiles')
    .select('id, username')
    .ilike('username', username);

  if (existingProfiles && existingProfiles.length > 0) {
    for (const p of existingProfiles) {
      if (p.id !== userData.user.id) {
        const renamedUsername = `old_${p.id.replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
        // Rename profile username to immediately release idx_profiles_username UNIQUE constraint
        await admin.from('profiles').update({ username: renamedUsername, is_active: false }).eq('id', p.id);
        await admin.from('user_roles').delete().eq('user_id', p.id);
        await admin.from('user_permission_overrides').delete().eq('user_id', p.id);
        await admin.from('launch_project_members').delete().eq('user_id', p.id);
        await admin.from('profiles').delete().eq('id', p.id);
        await admin.auth.admin.deleteUser(p.id).catch(() => {});
      }
    }
  }

  // 2. Clean up any stale invites for this username
  await admin.from('team_invites').delete().or(`username.eq.${username},email.eq.${email}`);

  // 3. Clean up any stale Auth users matching email
  const { data: usersList } = await admin.auth.admin.listUsers();
  const authUsers = (usersList?.users ?? []) as Array<{ id: string; email?: string }>;
  const oldAuthUser = authUsers.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase() && user.id !== userData.user.id,
  );
  if (oldAuthUser) {
    await admin.auth.admin.deleteUser(oldAuthUser.id).catch(() => {});
  }

  // 4. Create fresh Auth User
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { full_name: fullName, username, job_title: jobTitle || null },
  });

  if (createError || !created.user) {
    return res.status(400).json({ error: createError?.message ?? 'Pengguna gagal dibuat di Supabase Auth.' });
  }

  const userId = created.user.id;

  // 5. Insert/Upsert into profiles
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

  // 6. Assign role in user_roles
  await admin.from('user_roles').insert({
    user_id: userId,
    role_id: roleRow.id,
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.status(201).json({ id: userId, username, email, full_name: fullName, role_code: roleCode });
}
