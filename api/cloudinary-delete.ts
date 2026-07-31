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
  const { data: media, error: mediaError } = await supabase.from('media_assets').select('id, project_id, public_id, metadata, deleted_at').eq('id', mediaId).maybeSingle();
  if (mediaError || !media) return res.status(404).json({ error: 'Media tidak ditemukan' });
  if (media.deleted_at) return res.status(200).json({ success: true, already_deleted: true });
  const [{ data: project }, { data: membership }, { data: isAdmin }] = await Promise.all([
    supabase.from('launch_projects').select('owner_id').eq('id', media.project_id).maybeSingle(),
    supabase.from('launch_project_members').select('project_id').eq('project_id', media.project_id).eq('user_id', userData.user.id).maybeSingle(),
    supabase.rpc('has_permission', { permission_code: 'launch.admin' }),
  ]);
  if (!project || (project.owner_id !== userData.user.id && !membership && !isAdmin)) {
    return res.status(403).json({ error: 'Anda tidak terdaftar pada artikel pemilik media' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const signature = createHash('sha1').update(`invalidate=true&public_id=${media.public_id}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const body = new URLSearchParams({ public_id: media.public_id, timestamp: String(timestamp), invalidate: 'true', api_key: apiKey, signature });
  const metadata = media.metadata && typeof media.metadata === 'object'
    ? media.metadata as Record<string, unknown>
    : {};
  const resourceType = ['image', 'video', 'raw'].includes(String(metadata.resource_type))
    ? String(metadata.resource_type)
    : 'image';
  const cloudinaryResult = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, { method: 'POST', body });
  if (!cloudinaryResult.ok) return res.status(502).json({ error: 'Cloudinary belum dapat menghapus aset' });

  const deletedAt = new Date().toISOString();
  const { error: updateError } = await supabase.from('media_assets').update({ deleted_at: deletedAt }).eq('id', media.id);
  if (updateError) return res.status(500).json({ error: 'Status media belum dapat diperbarui' });
  await supabase
    .from('launch_references')
    .update({ image_url: null, media_asset_id: null })
    .eq('media_asset_id', media.id);
  return res.status(200).json({ success: true, media_id: media.id });
}
