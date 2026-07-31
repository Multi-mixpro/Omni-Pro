/**
 * Product Launch OS 3.0 - Penampil foto produk dengan deteksi resolusi rendah
 *
 * Foto yang di-hotlink dari marketplace sering berupa thumbnail kecil
 * (mis. 220x220). Saat ditampilkan besar hasilnya pecah dan tim produksi
 * tidak bisa menilai detail material. Komponen ini menandai kondisi itu
 * secara eksplisit alih-alih membiarkannya lolos diam-diam.
 */

import React, { useState } from 'react';
import { AlertTriangle, ImageOff } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Lebar render terbesar (px) — dipakai menilai apakah resolusi mencukupi. */
  displayWidth?: number;
  /** object-fit. 'contain' menjaga proporsi produk tanpa terpotong. */
  fit?: 'cover' | 'contain';
  showQualityWarning?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  displayWidth = 400,
  fit = 'cover',
  showQualityWarning = true,
}) => {
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 bg-slate-100 text-slate-400 ${className}`}>
        <ImageOff className="w-6 h-6" />
        <span className="text-[10px] font-bold">
          {src ? 'Foto gagal dimuat' : 'Belum ada foto'}
        </span>
      </div>
    );
  }

  // Anggap kurang tajam bila lebar asli di bawah kebutuhan render.
  const isLowRes = naturalWidth !== null && naturalWidth < displayWidth;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={(e) => setNaturalWidth(e.currentTarget.naturalWidth)}
        onError={() => setFailed(true)}
        className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
      />

      {showQualityWarning && isLowRes && (
        <span
          title={`Resolusi asli hanya ${naturalWidth}px — terlalu kecil untuk ditampilkan ${displayWidth}px. Unggah foto beresolusi lebih tinggi lewat Edit Data Artikel.`}
          className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/95 text-white text-[9px] font-bold shadow-sm"
        >
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span className="truncate">Resolusi rendah ({naturalWidth}px)</span>
        </span>
      )}
    </div>
  );
};
