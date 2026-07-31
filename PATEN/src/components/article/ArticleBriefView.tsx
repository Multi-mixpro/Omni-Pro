/**
 * Product Launch OS 3.0 - Article Brief View
 */

import React, { useState } from 'react';
import {
  Target,
  Users,
  Image as ImageIcon,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Save,
  Pencil,
} from 'lucide-react';
import { Article } from '../../types';
import { formatIDR } from '../../utils/calculations';
import { ProductImage } from '../shared/ProductImage';

interface ArticleBriefViewProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const ArticleBriefView: React.FC<ArticleBriefViewProps> = ({
  article,
  onUpdateArticle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [briefIntent, setBriefIntent] = useState(article.briefIntent);
  const [targetUser, setTargetUser] = useState(article.targetUserDescription);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(article.acceptanceCriteria);
  const [msrp, setMsrp] = useState(article.targetPriceMSRP);
  const [hpp, setHpp] = useState(article.targetHPP);

  const handleSave = () => {
    const updated: Article = {
      ...article,
      briefIntent,
      targetUserDescription: targetUser,
      acceptanceCriteria,
      targetPriceMSRP: msrp,
      targetHPP: hpp,
      lastUpdated: new Date().toISOString(),
    };
    onUpdateArticle(updated);
    setIsEditing(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-[#087E79] uppercase tracking-wider">
            Document Brief v1.0
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
            Brief Arahan Produk: {article.name}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Landasan awal tujuan, konsumen, dan kriteria penerimaan produk sebelum diproduksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-colors shadow-2xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Brief</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Brief</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Concept & Intent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Target className="w-4 h-4 text-[#087E79]" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Konsep & Arah Desain Produk
              </h3>
            </div>

            {isEditing ? (
              <textarea
                rows={4}
                value={briefIntent}
                onChange={(e) => setBriefIntent(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:border-[#087E79] focus:outline-none focus:bg-white"
              />
            ) : (
              <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                {article.briefIntent}
              </p>
            )}
          </div>

          {/* Target Consumer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Users className="w-4 h-4 text-[#087E79]" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Target Konsumen & Pengguna
              </h3>
            </div>

            {isEditing ? (
              <textarea
                rows={3}
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:border-[#087E79] focus:outline-none focus:bg-white"
              />
            ) : (
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {article.targetUserDescription}
              </p>
            )}
          </div>

          {/* Acceptance Criteria */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Kriteria Penerimaan Produk (Acceptance Criteria)
              </h3>
            </div>

            {isEditing ? (
              <textarea
                rows={3}
                value={acceptanceCriteria}
                onChange={(e) => setAcceptanceCriteria(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 focus:border-[#087E79] focus:outline-none focus:bg-white"
              />
            ) : (
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {article.acceptanceCriteria}
              </p>
            )}
          </div>

          {/* Gallery References */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Galeri Moodboard & Referensi
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {article.galleryImages.map((imgUrl, idx) => (
                <a
                  key={idx}
                  href={imgUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  title="Buka foto ukuran penuh"
                  className="block"
                >
                  <ProductImage
                    src={imgUrl}
                    alt={`Referensi ${idx + 1}`}
                    fit="contain"
                    displayWidth={320}
                    className="aspect-square rounded-xl border border-slate-200 bg-slate-50 hover:border-[#087E79] transition-colors"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          {/* Price Goals */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <DollarSign className="w-4 h-4 text-[#087E79]" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Target Harga & HPP
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Target Harga Jual (MSRP)</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={msrp}
                    onChange={(e) => setMsrp(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                  />
                ) : (
                  <span className="text-base font-black text-slate-900 font-mono">
                    {formatIDR(article.targetPriceMSRP)}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Target HPP Maksimal</span>
                {isEditing ? (
                  <input
                    type="number"
                    value={hpp}
                    onChange={(e) => setHpp(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900"
                  />
                ) : (
                  <span className="text-base font-black text-[#087E79] font-mono">
                    {formatIDR(article.targetHPP)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Key Team Members */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-[#087E79]" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Tim Penanggung Jawab
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Pimpro / Owner</span>
                <span className="font-bold text-slate-900">{article.pimproName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Product Developer</span>
                <span className="font-bold text-slate-900">{article.ownerName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
