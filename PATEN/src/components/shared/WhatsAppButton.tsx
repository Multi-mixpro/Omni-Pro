/**
 * Product Launch OS 3.0 - Tombol hubungi via WhatsApp
 * Membuka wa.me di tab baru: otomatis ke aplikasi WhatsApp bila terpasang,
 * jika tidak akan jatuh ke WhatsApp Web.
 */

import React from 'react';
import { MessageCircle } from 'lucide-react';
import { whatsAppUrl } from '../../utils/contact';

interface WhatsAppButtonProps {
  phone: string | undefined | null;
  /** Nama kontak, dipakai untuk label aksesibilitas & sapaan pesan. */
  contactName?: string;
  /** Pesan awal yang sudah terisi di kolom chat. */
  message?: string;
  variant?: 'icon' | 'full';
  className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  contactName,
  message,
  variant = 'icon',
  className = '',
}) => {
  const url = whatsAppUrl(phone, message);

  // Nomor tidak valid/kosong: tampilkan kontrol non-aktif, jangan tautan rusak.
  if (!url) {
    return (
      <span
        title="Nomor kontak belum tersedia atau tidak valid"
        className={
          variant === 'full'
            ? `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed ${className}`
            : `inline-flex items-center justify-center p-1.5 rounded-lg bg-slate-100 text-slate-300 cursor-not-allowed ${className}`
        }
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {variant === 'full' && <span>Nomor belum ada</span>}
      </span>
    );
  }

  const label = contactName ? `Hubungi ${contactName} via WhatsApp` : 'Hubungi via WhatsApp';

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={(event) => event.stopPropagation()}
      title={label}
      aria-label={label}
      className={
        variant === 'full'
          ? `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold transition-colors shadow-2xs ${className}`
          : `inline-flex items-center justify-center p-1.5 rounded-lg bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white transition-colors ${className}`
      }
    >
      <MessageCircle className="w-3.5 h-3.5" />
      {variant === 'full' && <span>WhatsApp</span>}
    </a>
  );
};
