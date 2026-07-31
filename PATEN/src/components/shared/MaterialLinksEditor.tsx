/**
 * Product Launch OS 3.0 - Editor tautan referensi material
 * Menyimpan link katalog warna, spec sheet, atau halaman toko dari supplier
 * supaya tim sourcing tidak perlu mencari ulang saat memilih bahan.
 */

import React, { useState } from 'react';
import { Plus, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { MaterialLink } from '../../types';
import { ConfirmDeleteButton } from './ConfirmDeleteButton';

const LINK_TYPES: Array<{ value: MaterialLink['type']; label: string }> = [
  { value: 'color_chart', label: 'Katalog Warna' },
  { value: 'catalog', label: 'Katalog Produk' },
  { value: 'spec', label: 'Spec Sheet' },
  { value: 'shop', label: 'Halaman Toko' },
  { value: 'other', label: 'Lainnya' },
];

const TYPE_STYLE: Record<MaterialLink['type'], string> = {
  color_chart: 'bg-violet-100 text-violet-700',
  catalog: 'bg-sky-100 text-sky-700',
  spec: 'bg-amber-100 text-amber-700',
  shop: 'bg-emerald-100 text-emerald-700',
  other: 'bg-slate-100 text-slate-600',
};

function labelFor(type: MaterialLink['type']) {
  return LINK_TYPES.find((t) => t.value === type)?.label || 'Lainnya';
}

/** Terima "example.com" maupun "https://example.com". */
function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

interface MaterialLinksEditorProps {
  links: MaterialLink[];
  onChange: (links: MaterialLink[]) => void;
  /** Mode ringkas untuk dipakai di dalam modal yang sudah padat. */
  compact?: boolean;
}

export const MaterialLinksEditor: React.FC<MaterialLinksEditorProps> = ({
  links,
  onChange,
  compact = false,
}) => {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<MaterialLink['type']>('color_chart');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError('URL tidak valid. Contoh: katalog.supplier.com/warna');
      return;
    }
    onChange([
      ...links,
      {
        id: crypto.randomUUID(),
        label: label.trim() || labelFor(type),
        url: normalized,
        type,
      },
    ]);
    setLabel('');
    setUrl('');
    setError(null);
  };

  return (
    <div className="space-y-2">
      {links.length > 0 && (
        <div className={`grid gap-1.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {links.map((link) => (
            <div
              key={link.id}
              className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200 shadow-2xs"
            >
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${TYPE_STYLE[link.type]}`}>
                {labelFor(link.type)}
              </span>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                title={link.url}
                className="flex items-center gap-1 min-w-0 flex-1 text-[11px] font-bold text-[#087E79] hover:underline"
              >
                <span className="truncate">{link.label}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
              <ConfirmDeleteButton
                onConfirm={() => onChange(links.filter((l) => l.id !== link.id))}
                label={`Hapus tautan ${link.label}`}
                className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
              />
            </div>
          ))}
        </div>
      )}

      <div className={`grid gap-1.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto_auto]'}`}>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nama tautan (opsional)"
          className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs"
        />
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="https://katalog-supplier.com/warna"
          className={`px-2.5 py-2 rounded-xl border bg-white text-xs ${
            error ? 'border-rose-300' : 'border-slate-200'
          }`}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as MaterialLink['type'])}
          className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
        >
          {LINK_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!url.trim()}
          className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] disabled:opacity-40 transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah</span>
        </button>
      </div>

      {error && <p className="text-[10px] text-rose-600 font-bold">{error}</p>}
      {links.length === 0 && !error && (
        <p className="text-[10px] text-slate-400 flex items-center gap-1">
          <LinkIcon className="w-3 h-3" />
          Simpan link katalog warna atau spec sheet dari supplier di sini.
        </p>
      )}
    </div>
  );
};
