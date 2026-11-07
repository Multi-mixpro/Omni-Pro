import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const auth = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false };

export async function authorizeTeamAdmin(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return null;
  }
  const browserUrl = process.env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const serverUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, '');
  const url = serverUrl || browserUrl;
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !anonKey || !serviceKey || (serverUrl && browserUrl && serverUrl !== browserUrl)) {
    res.status(503).json({ error: 'Konfigurasi server akun belum cocok dengan proyek Supabase aplikasi.' });
    return null;
  }
  const token = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? '')?.[1];
  if (!token) {
    res.status(401).json({ error: 'Sesi diperlukan. Silakan masuk kembali.' });
    return null;
  }
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: 'Bearer ' + token } }, auth });
  const { data, error } = await caller.auth.getUser(token);
  if (error || !data.user) {
    const unavailable = Boolean(error && (error.status === 0 || (error.status ?? 0) >= 500));
    res.status(unavailable ? 503 : 401).json({ error: unavailable
      ? 'Layanan autentikasi belum dapat dihubungi.'
      : 'Sesi tidak valid. Keluar lalu masuk kembali dengan akun admin.' });
    return null;
  }
  const [active, allowed] = await Promise.all([
    caller.rpc('is_active_user'), caller.rpc('has_permission', { permission_code: 'launch.admin' }),
  ]);
  if (active.error || allowed.error) {
    res.status(503).json({ error: 'Server belum dapat memeriksa izin pengelolaan akun.' });
    return null;
  }
  if (!active.data || !allowed.data) {
    res.status(403).json({ error: 'Hanya owner atau admin aktif yang dapat mengelola pengguna.' });
    return null;
  }
  return { user: data.user, admin: createClient(url, serviceKey, { auth }) };
}
