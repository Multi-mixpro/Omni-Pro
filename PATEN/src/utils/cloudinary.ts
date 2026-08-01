/**
 * Product Launch OS 3.0 - Optimasi pengiriman gambar Cloudinary
 *
 * Latar belakang kuota (paket gratis): 25 credit / 30 hari, di mana
 * 1 credit ≈ 1 GB bandwidth ≈ 1 GB storage ≈ 1.000 transformasi.
 *
 * Tanpa transformasi, aplikasi mengunduh berkas ASLI untuk setiap tampilan —
 * mis. foto 790px dipakai pada thumbnail 56px. Itu memboroskan bandwidth
 * berkali-kali lipat dari kebutuhan.
 *
 * Strategi:
 *  - f_auto  : kirim AVIF/WebP bila browser mendukung (biasanya jauh lebih kecil)
 *  - q_auto  : kualitas adaptif, tanpa perbedaan kasat mata
 *  - w_<n>,c_limit : batasi lebar sesuai kebutuhan tampilan, tidak pernah memperbesar
 *
 * PENTING soal kuota transformasi: setiap URL transformasi UNIK dihitung satu
 * transformasi (selanjutnya dilayani dari cache CDN). Karena itu lebar
 * dibulatkan ke sekumpulan BUCKET tetap — bukan nilai sembarang — supaya
 * jumlah transformasi tetap kecil dan dapat diprediksi.
 */

/** Bucket lebar tetap. Menambah bucket berarti menambah transformasi unik. */
const WIDTH_BUCKETS = [96, 200, 400, 800, 1600] as const;

const CLOUDINARY_HOST = 'res.cloudinary.com';

/** Bulatkan ke bucket terdekat yang >= lebar yang dibutuhkan. */
function snapWidth(width: number): number {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
  const needed = width * dpr;
  return WIDTH_BUCKETS.find((bucket) => bucket >= needed) ?? WIDTH_BUCKETS[WIDTH_BUCKETS.length - 1];
}

/**
 * Sisipkan transformasi ke URL Cloudinary.
 * URL non-Cloudinary (mis. hotlink marketplace) dikembalikan apa adanya.
 */
export function optimizedImageUrl(url: string | undefined | null, displayWidth = 400): string {
  if (!url) return '';

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url; // bukan URL absolut — biarkan
  }

  if (parsed.hostname !== CLOUDINARY_HOST) return url;

  // Format: /<cloud>/image/upload/<transformasi?>/<versi?>/<path>
  const marker = '/upload/';
  const at = parsed.pathname.indexOf(marker);
  if (at === -1) return url;

  const after = parsed.pathname.slice(at + marker.length);

  // Jangan menumpuk bila transformasi sudah pernah disisipkan.
  if (/(^|\/)(f_auto|q_auto|w_\d+)/.test(after)) return url;

  const transform = `f_auto,q_auto,w_${snapWidth(displayWidth)},c_limit`;
  parsed.pathname = `${parsed.pathname.slice(0, at + marker.length)}${transform}/${after}`;
  return parsed.toString();
}

/**
 * Kompres & perkecil gambar di sisi klien SEBELUM diunggah.
 * Menghemat dua kuota sekaligus: bandwidth unggah dan storage.
 * Foto kamera ponsel (4–8 MB) umumnya turun drastis tanpa kehilangan
 * detail yang dibutuhkan untuk menilai material.
 *
 * Mengembalikan berkas asli bila kompresi tidak menguntungkan atau gagal,
 * sehingga proses unggah tidak pernah terhambat oleh optimasi ini.
 */
export async function compressImageForUpload(file: File, maxDimension = 2000): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  // PNG bisa jadi aset dengan transparansi/teks tajam — jangan diubah ke JPEG.
  if (file.type === 'image/png') return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, maxDimension / Math.max(width, height));

    // Sudah cukup kecil dan tidak berat — tidak perlu diproses ulang.
    if (scale === 1 && file.size <= 1_000_000) {
      bitmap.close?.();
      return file;
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close?.();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', 0.85);
    });
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
