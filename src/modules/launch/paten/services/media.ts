import { supabase } from '@/integrations/supabase/client';
import { ArticleFile } from '../types';

type MediaKind =
  | 'TECH_PACK'
  | 'REFERENCE'
  | 'SAMPLE_EVIDENCE'
  | 'SIZE_CHART'
  | 'OTHER';

interface CloudinarySignature {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  upload_parameters: {
    allowed_formats: string;
    folder: string;
  };
}

interface CloudinaryUpload {
  public_id: string;
  secure_url: string;
  resource_type: 'image' | 'video' | 'raw';
  width?: number;
  height?: number;
  format?: string;
  bytes: number;
}

const PROJECT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ACCEPTED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export function validateArticleMediaFile(
  projectId: string,
  file: Pick<File, 'name' | 'type' | 'size'>,
) {
  if (!PROJECT_ID_PATTERN.test(projectId)) {
    throw new Error('Upload hanya tersedia untuk artikel yang sudah tersimpan di database.');
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error('Format file belum didukung. Gunakan PNG, JPG, WEBP, PDF, XLSX, atau DOCX.');
  }
  const maximumBytes = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 20 * 1024 * 1024;
  if (file.size > maximumBytes) {
    throw new Error(`Ukuran ${file.name} melebihi batas ${file.type.startsWith('image/') ? 10 : 20} MB.`);
  }
}

async function sessionToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Sesi upload tidak tersedia. Silakan masuk kembali.');
  }
  return data.session.access_token;
}

export async function uploadArticleMedia(
  projectId: string,
  file: File,
  kind: MediaKind,
): Promise<ArticleFile> {
  validateArticleMediaFile(projectId, file);
  const token = await sessionToken();
  const signatureResponse = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ project_id: projectId, kind }),
  });
  if (!signatureResponse.ok) {
    const payload = await signatureResponse.json().catch(() => ({}));
    throw new Error(payload.error || 'Tidak dapat menyiapkan upload media.');
  }
  const signature = await signatureResponse.json() as CloudinarySignature;

  const body = new FormData();
  body.append('file', file);
  body.append('folder', signature.upload_parameters.folder);
  body.append('allowed_formats', signature.upload_parameters.allowed_formats);
  body.append('timestamp', String(signature.timestamp));
  body.append('api_key', signature.api_key);
  body.append('signature', signature.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloud_name}/auto/upload`,
    { method: 'POST', body },
  );
  if (!uploadResponse.ok) {
    throw new Error(`Upload ${file.name} ke penyimpanan media gagal.`);
  }
  const uploaded = await uploadResponse.json() as CloudinaryUpload;

  const { data: media, error: mediaError } = await supabase
    .from('media_assets')
    .insert({
      project_id: projectId,
      kind,
      public_id: uploaded.public_id,
      secure_url: uploaded.secure_url,
      format: uploaded.format || file.name.split('.').pop() || null,
      width: uploaded.width || null,
      height: uploaded.height || null,
      bytes: uploaded.bytes || file.size,
      metadata: {
        original_name: file.name,
        mime_type: file.type,
        resource_type: uploaded.resource_type,
      },
    })
    .select('id, created_at')
    .single();
  if (mediaError) throw mediaError;

  if (kind === 'REFERENCE') {
    const { data: auth } = await supabase.auth.getUser();
    const { error } = await supabase.from('launch_references').insert({
      project_id: projectId,
      title: file.name.replace(/\.[^.]+$/, ''),
      reference_type: 'PRODUCT',
      image_url: uploaded.secure_url,
      media_asset_id: media.id,
      sort_order: 0,
      is_primary: false,
      created_by: auth.user?.id,
    });
    if (error) throw error;
  }

  return {
    id: String(media.id),
    name: file.name,
    url: uploaded.secure_url,
    kind,
    mimeType: file.type,
    bytes: uploaded.bytes || file.size,
    uploadedAt: String(media.created_at || new Date().toISOString()),
  };
}

export async function deleteArticleMedia(mediaId: string) {
  const token = await sessionToken();
  const response = await fetch('/api/cloudinary-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ media_id: mediaId }),
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Media belum dapat dihapus.');
  }
}
