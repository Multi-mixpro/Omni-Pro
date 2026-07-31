/**
 * Product Launch OS 3.0 - Kontak & WhatsApp helper
 */

/**
 * Normalisasi nomor telepon Indonesia ke format internasional tanpa tanda "+"
 * (format yang dibutuhkan wa.me).
 *
 *  "0812-3456-7890"   -> "6281234567890"
 *  "+62 812 3456 789" -> "628123456789"
 *  "62812..."         -> "62812..."
 *  "812..."           -> "62812..."
 *
 * Mengembalikan null bila nomor tidak layak dihubungi (kosong / terlalu pendek).
 */
export function normalizeWhatsAppNumber(raw: string | undefined | null): string | null {
  if (!raw) return null;

  // Sisakan digit saja (buang spasi, tanda hubung, kurung, titik, tanda plus).
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  // 0812... -> 62812...
  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith('62')) {
    // sudah format Indonesia
  } else if (digits.startsWith('8')) {
    // 812... (awalan 0 hilang saat input) -> 62812...
    digits = `62${digits}`;
  }

  // Nomor Indonesia valid: 62 + 9..13 digit. Longgar sedikit untuk nomor asing.
  if (digits.length < 9 || digits.length > 15) return null;

  return digits;
}

/** URL wa.me — otomatis membuka aplikasi WhatsApp bila terpasang, jika tidak ke WhatsApp Web. */
export function whatsAppUrl(rawNumber: string | undefined | null, message?: string): string | null {
  const number = normalizeWhatsAppNumber(rawNumber);
  if (!number) return null;
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
