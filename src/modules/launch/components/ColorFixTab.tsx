import React, { useState } from 'react';
import { Palette, Plus } from 'lucide-react';

interface ArticleColorItem {
  id: string;
  color_name: string;
  internal_color_code: string;
  supplier_color_code: string;
  hex_reference: string;
  is_final: boolean;
}

export const ColorFixTab: React.FC<{ workOrderId: string }> = () => {
  const [colors, setColors] = useState<ArticleColorItem[]>([
    {
      id: '1',
      color_name: 'Midnight Black',
      internal_color_code: 'CLR-BLK-01',
      supplier_color_code: 'SUP-BLK-99',
      hex_reference: '#0f172a',
      is_final: true,
    },
    {
      id: '2',
      color_name: 'Off White Cream',
      internal_color_code: 'CLR-WHT-02',
      supplier_color_code: 'SUP-WHT-12',
      hex_reference: '#f8fafc',
      is_final: true,
    },
  ]);

  const [newColorName, setNewColorName] = useState('');
  const [newHex, setNewHex] = useState('#3b82f6');

  const handleAddColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColorName) return;

    setColors([
      ...colors,
      {
        id: String(Date.now()),
        color_name: newColorName,
        internal_color_code: `CLR-${newColorName.substring(0, 3).toUpperCase()}-0${colors.length + 1}`,
        supplier_color_code: 'SUP-NEW-01',
        hex_reference: newHex,
        is_final: false,
      },
    ]);

    setNewColorName('');
  };

  const handleToggleFinal = (id: string) => {
    setColors(colors.map(c => c.id === id ? { ...c, is_final: !c.is_final } : c));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Tahap 4: Fix Warna & Swatch Fisik</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Penetapan palet warna final, kode internal, dan swatch fisik supplier
            </p>
          </div>
        </div>
      </div>

      {/* Add Color Form */}
      <form onSubmit={handleAddColor} className="flex gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <input
          type="text"
          placeholder="Nama Varian Warna..."
          value={newColorName}
          onChange={(e) => setNewColorName(e.target.value)}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
        />
        <input
          type="color"
          value={newHex}
          onChange={(e) => setNewHex(e.target.value)}
          className="w-10 h-9 bg-slate-950 border border-slate-800 rounded-lg p-0.5 cursor-pointer"
        />
        <button
          type="submit"
          className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Warna</span>
        </button>
      </form>

      {/* Colors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {colors.map((c) => (
          <div key={c.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full border border-slate-700 shadow-inner"
                  style={{ backgroundColor: c.hex_reference }}
                />
                <div>
                  <h4 className="font-bold text-xs text-white">{c.color_name}</h4>
                  <p className="text-[10px] text-slate-400">{c.internal_color_code}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleFinal(c.id)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  c.is_final
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {c.is_final ? 'FINAL' : 'DRAFT'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
