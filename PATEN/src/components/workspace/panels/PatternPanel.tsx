/**
 * Product Launch OS 3.0 - Pattern & Consumption Efficiency Panel
 */

import React, { useState } from 'react';
import { Layers, FileText, Save, Gauge, Ruler } from 'lucide-react';
import { Article } from '../../../types';

interface PatternPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const PatternPanel: React.FC<PatternPanelProps> = ({ article, onUpdateArticle }) => {
  const stored = article.patternSpecification;
  const [version, setVersion] = useState(stored?.version || '1.0');
  const [patternMaker, setPatternMaker] = useState(stored?.patternMaker || article.pimproName || '');
  const [markerEfficiency, setMarkerEfficiency] = useState(stored?.markerEfficiency || 0);
  const [estimatedConsumption, setEstimatedConsumption] = useState(stored?.estimatedConsumption || 0);
  const [unit, setUnit] = useState<'meter' | 'yard'>(stored?.unit || 'meter');
  const [patternNotes, setPatternNotes] = useState(stored?.notes || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onUpdateArticle({
      ...article,
      patternSpecification: {
        version: version.trim() || '1.0',
        patternMaker: patternMaker.trim(),
        markerEfficiency,
        estimatedConsumption,
        unit,
        notes: patternNotes.trim(),
        updatedAt: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="space-y-4 text-xs text-slate-900">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#087E79]" />
          <span className="font-bold text-slate-900">Spesifikasi Pola & Efisiensi Marker (Pattern)</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-500">Versi</label>
          <input
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            className="w-16 rounded-full border border-slate-200 bg-white px-2 py-1 text-center font-mono text-[10px] font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[11px] text-slate-500">Pattern Maker / Drafter</span>
          <input
            type="text"
            value={patternMaker}
            onChange={(e) => setPatternMaker(e.target.value)}
            className="w-full font-bold text-xs bg-transparent border-b border-slate-200 text-slate-900 focus:outline-none focus:border-[#087E79]"
          />
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="flex items-center gap-1 text-[11px] text-slate-500"><Gauge className="h-3 w-3" /> Efisiensi Marker</span>
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-[#087E79]">
            <input
              type="number"
              value={markerEfficiency}
              onChange={(e) => setMarkerEfficiency(parseFloat(e.target.value) || 0)}
              className="w-20 bg-transparent border-b border-slate-200 text-slate-900 focus:outline-none text-right focus:border-[#087E79]"
            />
            <span>%</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 shadow-2xs">
          <span className="flex items-center gap-1 text-[11px] text-slate-500"><Ruler className="h-3 w-3" /> Konsumsi per Produk</span>
          <div className="flex items-center gap-2 font-mono font-bold text-sm text-[#087E79]">
            <input
              type="number"
              step="0.01"
              value={estimatedConsumption}
              onChange={(e) => setEstimatedConsumption(parseFloat(e.target.value) || 0)}
              className="w-20 bg-transparent border-b border-slate-200 text-slate-900 focus:outline-none text-right focus:border-[#087E79]"
            />
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value as 'meter' | 'yard')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold"
            >
              <option value="meter">Meter</option>
              <option value="yard">Yard</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
        <label className="font-bold flex items-center gap-1.5 text-[#087E79]">
          <FileText className="w-4 h-4" />
          <span>Catatan Konstruksi Pola & Penyesuaian Cutting</span>
        </label>
        <textarea
          rows={3}
          value={patternNotes}
          onChange={(e) => setPatternNotes(e.target.value)}
          placeholder="Catat toleransi susut, seam allowance, arah serat, atau revisi cutting."
          className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#087E79]"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
        <p className="text-[11px] text-slate-500">
          {stored?.updatedAt ? `Terakhir disimpan ${new Date(stored.updatedAt).toLocaleString('id-ID')}` : 'Belum ada spesifikasi pola tersimpan.'}
        </p>
        <button
          type="button"
          onClick={handleSave}
          disabled={!patternMaker.trim() || markerEfficiency <= 0 || estimatedConsumption <= 0}
          className="inline-flex items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Save className="h-3.5 w-3.5" />
          {saved ? 'Tersimpan' : 'Simpan Pola'}
        </button>
      </div>
    </div>
  );
};
