import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import type { VercelRequest } from '@vercel/node';

export const attendanceSupabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
export const attendanceSupabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
export const attendanceServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const attendanceBiometricEncryptionKey = process.env.ATTENDANCE_BIOMETRIC_ENCRYPTION_KEY;
export const ATTENDANCE_PRIVATE_BUCKET = 'attendance-private';

const MAX_FACE_IMAGE_BYTES = 1_572_864;
const MIN_FACE_IMAGE_BYTES = 10_240;

export type ParsedFaceImage = {
  bytes: Buffer;
  contentType: 'image/jpeg' | 'image/webp';
  extension: 'jpg' | 'webp';
  sha256: string;
};

function firstHeader(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export function isSameOriginRequest(req: VercelRequest): boolean {
  const origin = firstHeader(req.headers.origin);
  if (!origin) return true;
  try {
    const requestHost = firstHeader(req.headers['x-forwarded-host']) || firstHeader(req.headers.host);
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

export function parseFaceImage(value: unknown): ParsedFaceImage {
  const raw = String(value ?? '');
  const match = /^data:(image\/jpeg|image\/webp);base64,([A-Za-z0-9+/=]+)$/.exec(raw);
  if (!match) throw new Error('Format foto wajah harus JPEG atau WebP.');

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length < MIN_FACE_IMAGE_BYTES || bytes.length > MAX_FACE_IMAGE_BYTES) {
    throw new Error('Ukuran foto wajah harus antara 10 KB dan 1,5 MB.');
  }

  const contentType = match[1] as ParsedFaceImage['contentType'];
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.at(-2) === 0xff && bytes.at(-1) === 0xd9;
  const webp = bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  if ((contentType === 'image/jpeg' && !jpeg) || (contentType === 'image/webp' && !webp)) {
    throw new Error('Isi foto wajah tidak sesuai format yang dinyatakan.');
  }

  return {
    bytes,
    contentType,
    extension: contentType === 'image/jpeg' ? 'jpg' : 'webp',
    sha256: createHash('sha256').update(bytes).digest('hex'),
  };
}

export function validateFaceDescriptor(value: unknown): number[] {
  if (!Array.isArray(value) || value.length < 512 || value.length > 2048) {
    throw new Error('Descriptor wajah tidak lengkap.');
  }
  const descriptor = value.map(Number);
  if (descriptor.some(item => !Number.isFinite(item) || Math.abs(item) > 100)) {
    throw new Error('Descriptor wajah tidak valid.');
  }
  return descriptor;
}

function biometricEncryptionKey(): Buffer {
  if (!attendanceBiometricEncryptionKey || attendanceBiometricEncryptionKey.length < 32) {
    throw new Error('Kunci enkripsi biometrik khusus belum tersedia.');
  }
  return createHash('sha256')
    .update(`attendance-biometric-v1|${attendanceBiometricEncryptionKey}`)
    .digest();
}

export function encryptFaceDescriptor(descriptor: number[]): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', biometricEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(descriptor), 'utf8'),
    cipher.final(),
  ]);
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptFaceDescriptor(input: {
  descriptor_ciphertext: string;
  descriptor_iv: string;
  descriptor_tag: string;
}): number[] {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    biometricEncryptionKey(),
    Buffer.from(input.descriptor_iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(input.descriptor_tag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(input.descriptor_ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  return validateFaceDescriptor(JSON.parse(plaintext));
}

// Mirrors Human's default normalized Minkowski/Euclidean similarity settings.
export function faceSimilarity(reference: number[], candidate: number[]): number {
  if (reference.length !== candidate.length) return 0;
  let sum = 0;
  for (let index = 0; index < reference.length; index += 1) {
    const difference = reference[index] - candidate[index];
    sum += difference * difference;
  }
  const distance = Math.round(100 * 25 * sum) / 100;
  if (distance === 0) return 1;
  const root = Math.sqrt(distance);
  const normalized = (1 - (root / 100) - 0.2) / (0.8 - 0.2);
  return Math.round(1000 * Math.max(Math.min(normalized, 1), 0)) / 1000;
}

export function jakartaDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function haversineMeters(
  latitude: number,
  longitude: number,
  targetLatitude: number,
  targetLongitude: number,
): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadius = 6_371_000;
  const latitudeDelta = radians(targetLatitude - latitude);
  const longitudeDelta = radians(targetLongitude - longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitude)) * Math.cos(radians(targetLatitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)));
}

export function finiteNumber(value: unknown, label: string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${label} tidak valid.`);
  return number;
}
