/**
 * Product Launch OS 3.0 - Product Brief & Direction Panel
 */

import React, { useState } from 'react';
import { Target, Users, CheckCircle, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { Article } from '../../../types';
import { ConfirmDeleteButton } from '../../shared/ConfirmDeleteButton';

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

  return (
    <div className="space-y-3 text-xs text-slate-900">
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
                      src={ref.url}
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
