import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!cloudName || !apiKey || !apiSecret || !supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Konfigurasi media belum lengkap' });
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan' });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return res.status(401).json({ error: 'Sesi tidak valid' });
  const { data: allowed } = await supabase.rpc('has_permission', { permission_code: 'launch.media.manage' });
  if (!allowed) return res.status(403).json({ error: 'Tidak memiliki izin menghapus media' });

  const mediaId = String(req.body?.media_id ?? '');
  const { data: media, error: mediaError } = await supabase.from('media_assets').select('id, public_id, deleted_at').eq('id', mediaId).maybeSingle();
  if (mediaError || !media) return res.status(404).json({ error: 'Media tidak ditemukan' });
  if (media.deleted_at) return res.status(200).json({ success: true, already_deleted: true });

  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash('sha1').update(`public_id=${media.public_id}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const body = new URLSearchParams({ public_id: media.public_id, timestamp: String(timestamp), api_key: apiKey, signature });
  const cloudinaryResult = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, { method: 'POST', body });
  if (!cloudinaryResult.ok) return res.status(502).json({ error: 'Cloudinary belum dapat menghapus aset' });

  const deletedAt = new Date().toISOString();
  const { error: updateError } = await supabase.from('media_assets').update({ deleted_at: deletedAt }).eq('id', media.id);
  if (updateError) return res.status(500).json({ error: 'Status media belum dapat diperbarui' });
  return res.status(200).json({ success: true, media_id: media.id });
}
