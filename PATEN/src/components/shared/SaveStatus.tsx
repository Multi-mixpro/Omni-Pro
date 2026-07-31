/**
 * Product Launch OS 3.0 - Indikator status autosave
 *
 * Lembar kerja PATEN tidak memakai tombol "Simpan": setiap perubahan langsung
 * dikirim ke database. Indikator ini memberi konfirmasi visual bahwa data
 * benar-benar tersimpan, supaya user tidak ragu apakah pekerjaannya aman.
 */

import React from 'react';
import { Check, Loader2, CloudOff } from 'lucide-react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusProps {
  state: SaveState;
  className?: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({ state, className = '' }) => {
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors';

  if (state === 'saving') {
    return (
      <span className={`${base} bg-sky-100 text-sky-700 ${className}`} aria-live="polite">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Menyimpan…</span>
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className={`${base} bg-rose-100 text-rose-700 ${className}`} aria-live="assertive">
        <CloudOff className="w-3 h-3" />
        <span>Gagal menyimpan</span>
      </span>
    );
  }

  if (state === 'saved') {
    return (
      <span className={`${base} bg-emerald-100 text-emerald-700 ${className}`} aria-live="polite">
        <Check className="w-3 h-3" />
        <span>Tersimpan</span>
      </span>
    );
  }

  // idle: tetap tampilkan penjelasan agar user tahu tidak perlu tombol simpan
  return (
    <span className={`${base} bg-slate-100 text-slate-500 ${className}`}>
      <Check className="w-3 h-3" />
      <span>Tersimpan otomatis</span>
    </span>
  );
};
