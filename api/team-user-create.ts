import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Team members sign in with a username, so Auth still needs an address. This
// internal domain never receives mail and is not a real mailbox.
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

  const { data: roleRow, error: roleError } = await admin.from('roles').select('code').eq('code', roleCode).maybeSingle();
  if (roleError) return res.status(500).json({ error: 'Gagal memeriksa role.' });
  if (!roleRow) return res.status(400).json({ error: 'Role tidak dikenal.' });

  const { data: existing, error: existingError } = await admin.from('profiles').select('id').ilike('username', username).maybeSingle();
  if (existingError) return res.status(500).json({ error: 'Gagal memeriksa username.' });
  if (existing) return res.status(409).json({ error: 'Username sudah dipakai.' });

  const email = `${username}@${INTERNAL_DOMAIN}`;

  // The invite is written first so the auth trigger provisions profile + role
  // atomically when the user is created.
  const { error: inviteError } = await admin.from('team_invites').insert({
    email,
    full_name: fullName,
    username,
    role_code: roleCode,
    job_title: jobTitle || null,
    invited_by: userData.user.id,
  });
  if (inviteError) return res.status(500).json({ error: 'Gagal menyiapkan undangan pengguna.' });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: pin,
    email_confirm: true,
    user_metadata: { full_name: fullName, username, job_title: jobTitle || null },
  });

  if (createError || !created.user) {
    await admin.from('team_invites').delete().eq('email', email);
    return res.status(400).json({ error: createError?.message ?? 'Pengguna gagal dibuat.' });
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(201).json({ id: created.user.id, username, email, full_name: fullName, role_code: roleCode });
}
