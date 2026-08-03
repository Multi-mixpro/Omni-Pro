/**
 * Product Launch OS 3.0 - Launch Readiness & Marketing Copy Panel
 */

import React, { useState } from 'react';
import { Rocket, FileText, CheckSquare, Plus, Trash2, Tag } from 'lucide-react';
import { Article } from '../../../types';

interface LaunchPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const LaunchPanel: React.FC<LaunchPanelProps> = ({ article, onUpdateArticle }) => {
  const [copywriting, setCopywriting] = useState(article.copywriting || '');

  const [sellingPoints, setSellingPoints] = useState<string[]>(article.sellingPoints || []);
  const [newPoint, setNewPoint] = useState('');

  const handleSaveCopy = () => {
    onUpdateArticle({
      ...article,
      copywriting,
      sellingPoints,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleAddPoint = () => {
    if (!newPoint.trim()) return;
    const updated = [...sellingPoints, newPoint];
    setSellingPoints(updated);
    onUpdateArticle({
      ...article,
      sellingPoints: updated,
      lastUpdated: new Date().toISOString(),
    });
    setNewPoint('');
  };

  const handleRemovePoint = (index: number) => {
    const updated = sellingPoints.filter((_, i) => i !== index);
    setSellingPoints(updated);
    onUpdateArticle({
      ...article,
      sellingPoints: updated,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 text-xs text-slate-900">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-[#087E79]" />
          <span className="font-bold text-slate-900">Persiapan Peluncuran Produk & Copywriting (Launch)</span>
        </div>
        <span className="text-[11px] font-mono font-bold text-[#087E79]">
          Target Rilis: {article.targetReleaseDate}
        </span>
      </div>

      {/* Copywriting */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <label className="font-bold flex items-center gap-1.5 text-[#087E79]">
          <FileText className="w-4 h-4" />
          <span>Deskripsi Produk & Copywriting Katalog</span>
        </label>
        <textarea
          rows={3}
          value={copywriting}
          onChange={(e) => setCopywriting(e.target.value)}
          onBlur={handleSaveCopy}
          placeholder="Tuliskan deskripsi produk untuk marketplace dan website..."
          className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#087E79]"
        />
      </div>

      {/* Key Selling Points */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <h4 className="font-bold flex items-center gap-1.5 text-[#087E79]">
          <Tag className="w-4 h-4" />
          <span>Keunggulan Utama / Key Selling Points</span>
        </h4>

        <div className="space-y-2">
          {sellingPoints.map((pt, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#DDF4F1] text-[#087E79] font-bold text-[10px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="font-medium text-slate-800">{pt}</span>
              </div>
              <button
                onClick={() => handleRemovePoint(idx)}
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tambah keunggulan produk baru..."
            value={newPoint}
            onChange={(e) => setNewPoint(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#087E79]"
          />
          <button
            onClick={handleAddPoint}
            className="px-3 py-2 rounded-lg bg-[#087E79] text-white font-bold flex items-center gap-1 hover:bg-[#066864] transition-colors shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>
    </div>
  );
};
