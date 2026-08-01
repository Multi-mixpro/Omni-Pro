import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PIN_PATTERN = /^\d{6}$/;
const DEVICE_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

type PinMatch = {
  matched_user_id: string;
  matched_email: string;
  matched_role: string;
};

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function clientFingerprints(req: VercelRequest, deviceId: string): {
  clientKey: string;
  networkKey: string;
} {
  const forwarded = firstHeader(req.headers['x-forwarded-for']).split(',')[0]?.trim();
  const ip = firstHeader(req.headers['x-real-ip']) || forwarded || 'unknown';
  const userAgent = firstHeader(req.headers['user-agent']).slice(0, 512);

  const clientKey = createHmac('sha256', serviceRoleKey!)
    .update(`${ip}|${userAgent}|${deviceId}`)
    .digest('hex');
  const networkKey = createHmac('sha256', serviceRoleKey!)
    .update(`network|${ip}`)
    .digest('hex');

  return { clientKey, networkKey };
}

function sameOriginRequest(req: VercelRequest): boolean {
  const origin = firstHeader(req.headers.origin);
  if (!origin) return true;

  try {
    const originHost = new URL(origin).host;
    const requestHost = firstHeader(req.headers['x-forwarded-host']) || firstHeader(req.headers.host);
    return originHost === requestHost;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!sameOriginRequest(req)) {
    return res.status(403).json({ error: 'Permintaan lintas origin ditolak.' });
  }
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return res.status(500).json({ error: 'Konfigurasi login Attendance belum lengkap.' });
  }

  const pin = String(req.body?.pin ?? '').trim();
  const deviceId = String(req.body?.device_id ?? '').trim();

  if (!PIN_PATTERN.test(pin)) {
    return res.status(400).json({ error: 'PIN harus tepat 6 digit.' });
  }
  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    return res.status(400).json({ error: 'Identitas perangkat tidak valid. Muat ulang halaman.' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { clientKey, networkKey } = clientFingerprints(req, deviceId);

  const { data: matches, error: verifyError } = await admin.rpc(
    'verify_attendance_kiosk_pin',
    { p_pin: pin, p_client_key: clientKey, p_network_key: networkKey },
  );

  if (verifyError) {
    if (verifyError.message.includes('ATTENDANCE_PIN_RATE_LIMITED')) {
      res.setHeader('Retry-After', '300');
      return res.status(429).json({
        error: 'Terlalu banyak percobaan. Tunggu 5 menit sebelum mencoba lagi.',
        retry_after_seconds: 300,
      });
    }
    if (verifyError.message.includes('ATTENDANCE_PIN_NETWORK_RATE_LIMITED')) {
      res.setHeader('Retry-After', '300');
      return res.status(429).json({
        error: 'Terlalu banyak percobaan dari jaringan ini. Tunggu 5 menit.',
        retry_after_seconds: 300,
      });
    }
    if (verifyError.message.includes('ATTENDANCE_PIN_SERVICE_BUSY')) {
      res.setHeader('Retry-After', '60');
      return res.status(503).json({
        error: 'Login PIN sedang dibatasi sementara. Coba lagi satu menit lagi.',
        retry_after_seconds: 60,
      });
    }
    return res.status(500).json({ error: 'PIN belum dapat diverifikasi. Coba kembali.' });
  }

  const match = (matches as PinMatch[] | null)?.[0];
  if (!match?.matched_user_id || !match.matched_email) {
    return res.status(401).json({ error: 'PIN tidak dikenali atau sudah dinonaktifkan.' });
  }

  // PIN tidak dijadikan password Auth. Server membuat magic-link token sekali
  // pakai, lalu langsung menukarnya menjadi sesi Supabase tanpa mengirim email.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: match.matched_email,
  });
  const tokenHash = linkData?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    return res.status(500).json({ error: 'Sesi Attendance gagal disiapkan.' });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sessionData, error: sessionError } = await authClient.auth.verifyOtp({
    type: 'magiclink',
    token_hash: tokenHash,
  });

  if (sessionError || !sessionData.session) {
    return res.status(500).json({ error: 'Sesi Attendance gagal dibuat.' });
  }

  return res.status(200).json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    expires_in: sessionData.session.expires_in,
    role: match.matched_role,
  });
}
