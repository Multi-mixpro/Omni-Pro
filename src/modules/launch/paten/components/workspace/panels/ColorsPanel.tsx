/**
 * Product Launch OS 3.0 - Colors, Colorways & Variant SKU Panel
 */

import React, { useState } from 'react';
import { Palette, Plus, Sparkles, Edit2, X } from 'lucide-react';
import { Article, Colorway } from '../../../types';
import { ConfirmDeleteButton } from '../../shared/ConfirmDeleteButton';

interface ColorsPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const ColorsPanel: React.FC<ColorsPanelProps> = ({ article, onUpdateArticle }) => {
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('');
  const [newColorHex, setNewColorHex] = useState('#1E293B');
  const [isCombination, setIsCombination] = useState(false);
  const [newSecondaryHex, setNewSecondaryHex] = useState('#E2E8F0');
  const [comboNotes, setComboNotes] = useState('');
  const [newPantone, setNewPantone] = useState('');
  const [isSampleColor, _setIsSampleColor] = useState(false);

  // Edit State
  const [editingCwId, setEditingCwId] = useState<string | null>(null);
  const [editCw, setEditCw] = useState<Partial<Colorway>>({});

  const handleAddColorway = () => {
    if (!newColorName.trim()) return;
    const newCw: Colorway = {
      id: crypto.randomUUID(),
      code: newColorCode || `CW-${(article.colorways?.length || 0) + 1}`,
      name: newColorName,
      hex: newColorHex,
      secondaryHex: isCombination ? newSecondaryHex : undefined,
      comboPartsNote: isCombination ? comboNotes : undefined,
      pantone: newPantone,
      isSampleColor,
    };

    onUpdateArticle({
      ...article,
      colorways: [...(article.colorways || []), newCw],
      lastUpdated: new Date().toISOString(),
    });

    setNewColorName('');
    setNewColorCode('');
    setNewPantone('');
    setComboNotes('');
    setIsCombination(false);
  };

  const handleSaveEdit = () => {
    if (!editingCwId) return;

    const updated = (article.colorways || []).map((cw) => {
      if (cw.id === editingCwId) {
        return {
          ...cw,
          ...editCw,
        } as Colorway;
      }
      return cw;
    });

    onUpdateArticle({
      ...article,
      colorways: updated,
      lastUpdated: new Date().toISOString(),
    });

    setEditingCwId(null);
    setEditCw({});
  };

  const handleRemoveColorway = (id: string) => {
    onUpdateArticle({
      ...article,
      colorways: (article.colorways || []).filter((c) => c.id !== id),
      lastUpdated: new Date().toISOString(),
    });
  };

  const totalSKUs = (article.colorways?.length || 0) * (article.sizeSet?.length || 0);

  return (
    <div className="space-y-4 text-xs text-slate-900">
      {/* Header Summary & SKU Counter */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#087E79]" />
          <span className="font-bold text-slate-900">Total Varian Warna ({article.colorways?.length || 0})</span>
        </div>
        <div className="flex items-center gap-2 font-mono font-bold text-[#087E79]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{totalSKUs} SKU Kombinasi Terbentuk ({article.sizeSet?.length || 0} Size)</span>
        </div>
      </div>

      {/* Existing Colorways Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(article.colorways || []).map((cw) => {
          const isEditingThis = editingCwId === cw.id;

          if (isEditingThis) {
            return (
              <div
                key={cw.id}
                className="p-3 bg-teal-50/50 rounded-xl border-2 border-[#087E79] space-y-2.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#087E79]">Edit Varian Warna</span>
                  <button onClick={() => setEditingCwId(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={editCw.name || ''}
                    onChange={(e) => setEditCw({ ...editCw, name: e.target.value })}
                    className="w-full p-1.5 rounded border border-slate-200 bg-white font-bold"
                    placeholder="Nama Warna"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editCw.code || ''}
                      onChange={(e) => setEditCw({ ...editCw, code: e.target.value })}
                      className="p-1.5 rounded border border-slate-200 bg-white font-mono"
                      placeholder="Kode SKU"
                    />
                    <input
                      type="text"
                      value={editCw.pantone || ''}
                      onChange={(e) => setEditCw({ ...editCw, pantone: e.target.value })}
                      className="p-1.5 rounded border border-slate-200 bg-white"
                      placeholder="Pantone TCX"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Warna Utama:</span>
                      <input
                        type="color"
                        value={editCw.hex || '#000000'}
                        onChange={(e) => setEditCw({ ...editCw, hex: e.target.value })}
                        className="w-7 h-7 p-0.5 rounded cursor-pointer border"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Warna Kombinasi:</span>
                      <input
                        type="color"
                        value={editCw.secondaryHex || '#ffffff'}
                        onChange={(e) => setEditCw({ ...editCw, secondaryHex: e.target.value })}
                        className="w-7 h-7 p-0.5 rounded cursor-pointer border"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={editCw.comboPartsNote || ''}
                    onChange={(e) => setEditCw({ ...editCw, comboPartsNote: e.target.value })}
                    className="w-full p-1.5 rounded border border-slate-200 bg-white text-[11px]"
                    placeholder="Catatan bagian (misal: Body Navy, Lengan Off-White)"
                  />
                </div>

                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    onClick={() => setEditingCwId(null)}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 font-bold rounded"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-2.5 py-1 bg-[#087E79] text-white font-bold rounded"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={cw.id}
              className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs group hover:border-[#087E79] transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Combination Color Swatch Badge */}
                <div className="relative shrink-0">
                  <span
                    className="w-8 h-8 rounded-full border-2 border-slate-200 shadow-xs inline-block overflow-hidden"
                    style={{ backgroundColor: cw.hex }}
                  >
                    {cw.secondaryHex && (
                      <span
                        className="w-full h-1/2 block absolute bottom-0 left-0 border-t border-white/40"
                        style={{ backgroundColor: cw.secondaryHex }}
                      />
                    )}
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{cw.name}</span>
                    {cw.isSampleColor && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#DDF4F1] text-[#087E79]">
                        Sample
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {cw.code} {cw.pantone && `· Pantone ${cw.pantone}`}
                  </div>
                  {cw.comboPartsNote && (
                    <div className="text-[10px] text-teal-700 font-medium italic mt-0.5">
                      {cw.comboPartsNote}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingCwId(cw.id);
                    setEditCw(cw);
                  }}
                  className="text-slate-400 hover:text-[#087E79] p-1.5 transition-colors"
                  title="Edit Varian Warna"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <ConfirmDeleteButton
                  onConfirm={() => handleRemoveColorway(cw.id)}
                  label="Hapus Varian Warna"
                  className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Colorway / Jacket Combination Form */}
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-[#087E79] flex items-center gap-1.5">
            <Palette className="w-4 h-4" />
            <span>Tambah Colorway / Varian Warna Baru (Kombinasi Jaket/Baju)</span>
          </h4>
          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isCombination}
              onChange={(e) => setIsCombination(e.target.checked)}
              className="rounded text-[#087E79] focus:ring-[#087E79]"
            />
            <span>Model Warna Kombinasi (Multi-Color)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
          <input
            type="text"
            placeholder="Nama Warna (misal: Obsidian Navy / Off-White)"
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#087E79] col-span-2 font-bold"
          />
          <input
            type="text"
            placeholder="Kode Warna (misal: NVY-WHT)"
            value={newColorCode}
            onChange={(e) => setNewColorCode(e.target.value)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#087E79] font-mono"
          />

          <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1" title="Warna Utama (Body)">
              <span className="text-[10px] text-slate-400">Main:</span>
              <input
                type="color"
                value={newColorHex}
                onChange={(e) => setNewColorHex(e.target.value)}
                className="w-8 h-8 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
              />
            </div>

            {isCombination && (
              <div className="flex items-center gap-1" title="Warna Kombinasi (Lengan/Aksen)">
                <span className="text-[10px] text-slate-400">Combo:</span>
                <input
                  type="color"
                  value={newSecondaryHex}
                  onChange={(e) => setNewSecondaryHex(e.target.value)}
                  className="w-8 h-8 p-0.5 rounded-lg border border-slate-200 cursor-pointer"
                />
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Pantone TCX"
            value={newPantone}
            onChange={(e) => setNewPantone(e.target.value)}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#087E79]"
          />
        </div>

        {isCombination && (
          <div className="p-2.5 rounded-lg bg-teal-50/60 border border-teal-200 space-y-1">
            <label className="text-[11px] font-bold text-teal-900 block">
              Detail Kombinasi Bagian Warna (Jaket Kombinasi):
            </label>
            <input
              type="text"
              placeholder="Contoh: Body Utama Navy 600D, Lengan & Kerah Off-White, Lining/Furing Orange"
              value={comboNotes}
              onChange={(e) => setComboNotes(e.target.value)}
              className="w-full p-2 rounded-lg border border-teal-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-[#087E79]"
            />
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={handleAddColorway}
            disabled={!newColorName.trim()}
            className="px-4 py-2 rounded-lg bg-[#087E79] text-white font-bold flex items-center justify-center gap-1.5 hover:bg-[#066864] disabled:opacity-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simpan Varian Warna</span>
          </button>
        </div>
      </div>
    </div>
  );
};
