import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.VITE_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

const PROJECT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MEDIA_KINDS = new Set(['tech_pack', 'reference', 'sample_evidence', 'size_chart', 'other']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!cloudName || !apiKey || !apiSecret || !supabaseUrl || !supabaseAnonKey) return res.status(500).json({ error: 'Konfigurasi upload belum lengkap' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Sesi diperlukan' });
  const projectId = String(req.body?.project_id ?? '');
  const kind = String(req.body?.kind ?? '').toLowerCase();
  if (!PROJECT_ID_PATTERN.test(projectId) || !MEDIA_KINDS.has(kind)) {
    return res.status(400).json({ error: 'Target upload tidak valid' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return res.status(401).json({ error: 'Sesi tidak valid' });
  const { data: allowed, error: permissionError } = await supabase.rpc('has_permission', { permission_code: 'launch.media.manage' });
  if (permissionError || !allowed) return res.status(403).json({ error: 'Tidak memiliki izin upload media' });
  const [{ data: project }, { data: membership }, { data: isAdmin }] = await Promise.all([
    supabase.from('launch_projects').select('id, owner_id').eq('id', projectId).maybeSingle(),
    supabase.from('launch_project_members').select('project_id').eq('project_id', projectId).eq('user_id', userData.user.id).maybeSingle(),
    supabase.rpc('has_permission', { permission_code: 'launch.admin' }),
  ]);
  if (!project || (project.owner_id !== userData.user.id && !membership && !isAdmin)) {
    return res.status(403).json({ error: 'Anda tidak terdaftar pada artikel tujuan upload' });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = `gg-indo-apparel/product-launch/${projectId}/${kind}`;
  const allowedFormats = 'docx,jpeg,jpg,pdf,png,webp,xlsx';
  // Cloudinary mensyaratkan SHA-1 dari (parameter terurut + api_secret) yang
  // DIGABUNG, bukan HMAC. Memakai HMAC menghasilkan tanda tangan berbeda dan
  // ditolak upload dengan 401. Formatnya sama seperti di cloudinary-delete.ts.
  const paramsToSign = `allowed_formats=${allowedFormats}&folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash('sha1').update(`${paramsToSign}${apiSecret}`).digest('hex');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    signature,
    timestamp,
    api_key: apiKey,
    cloud_name: cloudName,
    upload_parameters: {
      allowed_formats: allowedFormats,
      folder,
    },
  });
}
