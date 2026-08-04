/**
 * Product Launch OS 3.0 - Product Brief & Direction Panel
 */

import React, { useState } from 'react';
import {
  Target,
  Users,
  CheckCircle,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Ruler,
  Building2,
  Tag,
  User,
  CalendarClock,
  Rocket,
  Wallet,
  Coins,
} from 'lucide-react';
import { Article } from '../../../types';
import { ConfirmDeleteButton } from '../../shared/ConfirmDeleteButton';
import { optimizedImageUrl } from '../../../utils/cloudinary';
import { formatIDR } from '../../../utils/calculations';

interface BriefPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const BriefPanel: React.FC<BriefPanelProps> = ({ article, onUpdateArticle }) => {
  const [briefIntent, setBriefIntent] = useState(article.briefIntent || '');
  const [targetUserDescription, setTargetUserDescription] = useState(article.targetUserDescription || '');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(article.acceptanceCriteria || '');

  const handleSaveText = () => {
    onUpdateArticle({
      ...article,
      briefIntent,
      targetUserDescription,
      acceptanceCriteria,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleRemoveReference = (id: string) => {
    onUpdateArticle({
      ...article,
      references: (article.references || []).filter((r) => r.id !== id),
      lastUpdated: new Date().toISOString(),
    });
  };

  // Ringkasan data yang diisi saat pembuatan artikel. Sebelumnya unit bisnis,
  // kategori, gender, season, dan target harga/tanggal tidak tampil di Brief
  // sehingga terasa "hilang" padahal tersimpan pada artikel.
  const identityItems: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    sub?: string;
    tint: string;
  }> = [
    { icon: Building2, label: 'Unit Bisnis', value: article.businessUnit || '—', tint: 'text-teal-600 bg-teal-50' },
    { icon: Tag, label: 'Kategori', value: article.category || '—', sub: article.subCategory, tint: 'text-indigo-600 bg-indigo-50' },
    { icon: User, label: 'Target Gender', value: article.genderTarget || '—', tint: 'text-violet-600 bg-violet-50' },
    { icon: CalendarClock, label: 'Season / Koleksi', value: article.seasonCollection || '—', tint: 'text-sky-600 bg-sky-50' },
    { icon: CalendarClock, label: 'Target Sample', value: article.targetSampleDate || '—', tint: 'text-amber-600 bg-amber-50' },
    { icon: Rocket, label: 'Target Rilis', value: article.targetReleaseDate || '—', tint: 'text-orange-600 bg-orange-50' },
    { icon: Wallet, label: 'Target MSRP', value: article.targetPriceMSRP ? formatIDR(article.targetPriceMSRP) : '—', tint: 'text-emerald-600 bg-emerald-50' },
    { icon: Coins, label: 'Target HPP', value: article.targetHPP ? formatIDR(article.targetHPP) : '—', tint: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-3 text-xs text-slate-900">
      {/* Identitas & Target Artikel — data dasar dari form pembuatan artikel */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider mb-2.5">
          <Target className="w-3.5 h-3.5 text-[#087E79]" />
          <span>Identitas & Target Artikel</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {identityItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-start gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/60"
              >
                <span className={`p-1.5 rounded-lg shrink-0 ${item.tint}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate">
                    {item.label}
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-900 leading-tight break-words">
                    {item.value}
                  </div>
                  {item.sub && (
                    <div className="text-[10px] font-medium text-slate-500 truncate">{item.sub}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Varian Warna & Rentang Ukuran Brief */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gradient-to-br from-[#DDF4F1]/60 to-teal-50/80 p-3.5 rounded-2xl border border-teal-200 shadow-2xs">
        {/* Colorways */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#087E79] font-extrabold text-[11px]">
            <Palette className="w-3.5 h-3.5" />
            <span>Varian Warna Brief ({article.colorways?.length || 0} Warna)</span>
          </div>
          {article.colorways && article.colorways.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {article.colorways.map((cw) => (
                <span
                  key={cw.id || cw.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                    style={{ backgroundColor: cw.hex || '#000000' }}
                  />
                  <span>{cw.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">({cw.code})</span>
                  {cw.isSampleColor && (
                    <span className="text-[8px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-extrabold">
                      Sampel
                    </span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Belum ada varian warna dipilih.</p>
          )}
        </div>

        {/* Size Range */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#087E79] font-extrabold text-[11px]">
            <Ruler className="w-3.5 h-3.5" />
            <span>Rentang Ukuran ({article.sizeSet?.length || 0} Size)</span>
          </div>
          {article.sizeSet && article.sizeSet.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {article.sizeSet.map((sz) => {
                const isBase = sz === article.baseSize;
                return (
                  <span
                    key={sz}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs border ${
                      isBase
                        ? 'bg-[#087E79] text-white border-[#087E79]'
                        : 'bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    <span>{sz}</span>
                    {isBase && <span className="text-[8px] font-mono uppercase bg-white/30 px-1 rounded">BASE</span>}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">Belum ada ukuran dipilih.</p>
          )}
        </div>
      </div>
      {/* Intent & Target Audience */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-[#087E79] font-bold text-[11px]">
            <Target className="w-3.5 h-3.5" />
            <span>Arah & Tujuan Produk (Product Intent)</span>
          </div>
          <textarea
            rows={2.5 as any}
            value={briefIntent}
            onChange={(e) => setBriefIntent(e.target.value)}
            onBlur={handleSaveText}
            placeholder="Jelaskan konsep utama, fungsi produk, dan positioning koleksi..."
            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#087E79] focus:outline-none"
          />
        </div>

        <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-1.5 text-[#087E79] font-bold text-[11px]">
            <Users className="w-3.5 h-3.5" />
            <span>Target Pengguna & Styling Context</span>
          </div>
          <textarea
            rows={2.5 as any}
            value={targetUserDescription}
            onChange={(e) => setTargetUserDescription(e.target.value)}
            onBlur={handleSaveText}
            placeholder="Siapa pengguna utama? (Demografi, gaya hidup, tempat pemakaian)..."
            className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#087E79] focus:outline-none"
          />
        </div>
      </div>

      {/* Acceptance Criteria */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[#087E79] font-bold text-[11px]">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Kriteria Kelulusan (Acceptance Criteria)</span>
        </div>
        <textarea
          rows={2}
          value={acceptanceCriteria}
          onChange={(e) => setAcceptanceCriteria(e.target.value)}
          onBlur={handleSaveText}
          placeholder="Daftar poin mutlak yang harus dipenuhi (misal: Saku muat iPad 11 inci, water-repellent Grade 4)..."
          className="w-full p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-[#087E79] focus:outline-none"
        />
      </div>

      {/* References & Inspiration Board — tampilan saja.
          Penambahan referensi dilakukan di form Tambah Prospek Artikel Baru. */}
      <div className="space-y-2.5 bg-gradient-to-br from-violet-50 to-violet-100/50 p-3.5 rounded-2xl border border-violet-200">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-violet-200/70">
          <h4 className="font-bold flex items-center gap-1.5 text-violet-950 text-[11px]">
            <ImageIcon className="w-3.5 h-3.5 text-violet-600" />
            <span>Papan Referensi & Links</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white text-violet-700 text-[10px] font-extrabold">
              {article.references?.length || 0}
            </span>
          </h4>
          <span className="text-[10px] text-violet-900/60 italic hidden sm:inline">
            Ditambahkan saat pembuatan artikel
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(article.references || []).map((ref) => {
            const isImage = !!ref.url && /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(ref.url);
            return (
              <div
                key={ref.id}
                className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start gap-2.5 shadow-2xs"
              >
                {isImage ? (
                  <a href={ref.url} target="_blank" rel="noreferrer" className="shrink-0">
                    <img
                      src={optimizedImageUrl(ref.url, 96)}
                      alt={ref.title}
                      loading="lazy"
                      className="w-11 h-11 rounded-lg object-cover border border-slate-200"
                    />
                  </a>
                ) : (
                  <span className="w-11 h-11 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <LinkIcon className="w-4 h-4 text-violet-500" />
                  </span>
                )}

                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-violet-100 text-violet-700">
                      {ref.label}
                    </span>
                    <span className="font-bold text-slate-900 truncate">{ref.title}</span>
                  </div>
                  {ref.url && (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-violet-700 hover:underline flex items-center gap-1 font-medium min-w-0"
                    >
                      <LinkIcon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{ref.url}</span>
                    </a>
                  )}
                  {ref.note && <p className="text-[11px] text-slate-500 italic">{ref.note}</p>}
                </div>

                <ConfirmDeleteButton
                  onConfirm={() => handleRemoveReference(ref.id)}
                  label={`Hapus referensi ${ref.title}`}
                  className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                />
              </div>
            );
          })}
          {(article.references || []).length === 0 && (
            <p className="text-[11px] text-violet-900/50 italic sm:col-span-2 py-2">
              Belum ada referensi. Tambahkan saat mengisi form Tambah Prospek Artikel Baru.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
