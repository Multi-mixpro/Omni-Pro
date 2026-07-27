import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

function cleanFolder(value: string) {
  return value.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\/{2,}/g, '/').slice(0, 180);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!cloudName || !apiKey || !apiSecret || !supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Konfigurasi upload belum lengkap' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan' });
  const folder = cleanFolder(String(req.body?.folder ?? ''));
  if (!folder.startsWith('gg-indo-apparel/product-launch/')) return res.status(400).json({ error: 'Folder upload tidak diizinkan' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return res.status(401).json({ error: 'Sesi tidak valid' });
  const { data: allowed, error: permissionError } = await supabase.rpc('has_permission', { permission_code: 'launch.media.manage' });
  if (permissionError || !allowed) return res.status(403).json({ error: 'Tidak memiliki izin upload media' });

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHmac('sha256', apiSecret).update(paramsToSign).digest('hex');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ signature, timestamp, api_key: apiKey, cloud_name: cloudName });
}
