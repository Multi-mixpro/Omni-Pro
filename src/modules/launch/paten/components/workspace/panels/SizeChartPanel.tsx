/**
 * Product Launch OS 3.0 - Workspace Panel: Sizes & Size Chart
 */

import React, { useState, useEffect } from 'react';
import {
  Ruler,
  Plus,
  X,
  ChevronRight,
  ChevronLeft,
  Settings2,
  Sparkles,
  Search,
} from 'lucide-react';
import { Article, SizeChartRow, MeasurementField, CategoryType } from '../../../types';
import {
  MEASUREMENT_FIELDS,
  measurementFieldsForCategory,
  requiredFieldsForCategory,
  buildCategoryDefaultSizeChart,
  generateDefaultTargetValues,
} from '../../../data/measurementFields';

interface SizeChartPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

const STANDARD_SIZE_ORDER = [
  '3XS',
  '2XS',
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  'XXL',
  '3XL',
  'XXXL',
  '4XL',
  '5XL',
  'ALL SIZE',
  'FREE SIZE',
];

const sortSizesSequentially = (sizeList: string[]) => {
  return [...sizeList].sort((a, b) => {
    const idxA = STANDARD_SIZE_ORDER.indexOf(a.trim().toUpperCase());
    const idxB = STANDARD_SIZE_ORDER.indexOf(b.trim().toUpperCase());
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
};

export const SizeChartPanel: React.FC<SizeChartPanelProps> = ({
  article,
  onUpdateArticle,
}) => {
  const [activeSizeIndex, setActiveSizeIndex] = useState(0);
  const [mobileMode, setMobileMode] = useState<'by_size' | 'full_matrix'>('by_size');
  const [viewMode, setViewMode] = useState<'target' | 'actual' | 'dual'>('target');
  const [showManageModal, setShowManageModal] = useState(false);
  const [modalCategoryFilter, setModalCategoryFilter] = useState<string>('RECOMMENDED');
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customTolerance, setCustomTolerance] = useState(1.0);

  const rawSizes = article.sizeSet && article.sizeSet.length > 0 ? article.sizeSet : ['S', 'M', 'L', 'XL', '2XL'];
  const sizes = sortSizesSequentially(rawSizes);
  const activeSize = sizes[activeSizeIndex] || sizes[0] || 'M';

  // Auto-detect: variabel yang relevan dengan kategori artikel ini
  const categoryFields = measurementFieldsForCategory(article.category);
  const otherCategoryFields = MEASUREMENT_FIELDS.filter((f) => f.category !== article.category);
  const categoryTemplateFields = requiredFieldsForCategory(article.category);
  const hasCategoryTemplate = categoryTemplateFields.length > 0;

  // Auto-sync: Pastikan sizeChart selalu terisi & sinkron 100% dengan article.sizeSet & category
  useEffect(() => {
    const currentChart = article.sizeChart || [];
    if (currentChart.length === 0) {
      const synced = buildCategoryDefaultSizeChart(article.category, sizes);
      onUpdateArticle({
        ...article,
        sizeChart: synced,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      let needsSync = false;
      const synced = currentChart.map((row) => {
        const missingSizes = sizes.filter((s) => row.targetValues[s] === undefined);
        if (missingSizes.length > 0) {
          needsSync = true;
          const newTargets = { ...row.targetValues };
          const generated = generateDefaultTargetValues(row.fieldId.toUpperCase(), sizes);
          sizes.forEach((s) => {
            if (newTargets[s] === undefined) {
              newTargets[s] = generated[s] || 50;
            }
          });
          return { ...row, targetValues: newTargets };
        }
        return row;
      });

      if (needsSync) {
        onUpdateArticle({
          ...article,
          sizeChart: synced,
          lastUpdated: new Date().toISOString(),
        });
      }
    }
  }, [article.id, article.category, sizes.join(',')]);

  // Apply category size chart template
  const applyCategoryTemplate = (selectedCategory?: CategoryType) => {
    const targetCat = selectedCategory || article.category;
    const defaultChart = buildCategoryDefaultSizeChart(targetCat, sizes);

    onUpdateArticle({
      ...article,
      category: targetCat,
      sizeChart: defaultChart,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Remove a variable row
  const handleRemoveRow = (fieldId: string) => {
    const updatedRows = (article.sizeChart || []).filter((r) => r.fieldId !== fieldId);
    onUpdateArticle({
      ...article,
      sizeChart: updatedRows,
      lastUpdated: new Date().toISOString(),
    });
  };

  // Add a preset recommended variable
  const handleAddPresetField = (field: MeasurementField) => {
    const existing = article.sizeChart || [];
    if (existing.some((r) => r.fieldId === field.id || r.fieldName === field.labelId)) return;

    const defaultTargets = generateDefaultTargetValues(field.code, sizes);

    const newRow: SizeChartRow = {
      fieldId: field.id,
      fieldName: field.labelId,
      tolerance: field.defaultTolerance,
      targetValues: defaultTargets,
      sampleActualValues: {},
    };

    onUpdateArticle({
      ...article,
      sizeChart: [...existing, newRow],
      lastUpdated: new Date().toISOString(),
    });
  };

  // Add a custom variable
  const handleAddCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFieldName.trim()) return;

    const existing = article.sizeChart || [];
    const defaultTargets: Record<string, number> = {};
    sizes.forEach((s, idx) => {
      defaultTargets[s] = 50 + idx * 2;
    });

    const newRow: SizeChartRow = {
      fieldId: `custom-${Date.now()}`,
      fieldName: customFieldName.trim(),
      tolerance: Number(customTolerance) || 1.0,
      targetValues: defaultTargets,
      sampleActualValues: {},
    };

    onUpdateArticle({
      ...article,
      sizeChart: [...existing, newRow],
      lastUpdated: new Date().toISOString(),
    });

    setCustomFieldName('');
    setCustomTolerance(1.0);
  };

  const handleUpdateTargetValue = (fieldId: string, sizeCode: string, val: number) => {
    const updatedRows = (article.sizeChart || []).map((row) => {
      if (row.fieldId === fieldId) {
        return {
          ...row,
          targetValues: {
            ...row.targetValues,
            [sizeCode]: val,
          },
        };
      }
      return row;
    });

    onUpdateArticle({
      ...article,
      sizeChart: updatedRows,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleUpdateActualValue = (fieldId: string, sizeCode: string, val: number) => {
    const updatedRows = (article.sizeChart || []).map((row) => {
      if (row.fieldId === fieldId) {
        return {
          ...row,
          sampleActualValues: {
            ...row.sampleActualValues,
            [sizeCode]: val,
          },
        };
      }
      return row;
    });

    onUpdateArticle({
      ...article,
      sizeChart: updatedRows,
      lastUpdated: new Date().toISOString(),
    });
  };

  const currentChart = article.sizeChart || [];
  const activeFieldIds = new Set(currentChart.map((r) => r.fieldId));
  const activeFieldNames = new Set(currentChart.map((r) => r.fieldName));

  return (
    <div className="space-y-3 text-xs text-slate-900">
      {/* Panel Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-gradient-to-br from-indigo-50 to-indigo-100/60 border border-indigo-200 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-xs text-indigo-950">
              Size Chart & Fitting Result Matrix ({sizes.length} Size: {sizes.join(', ')})
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white text-indigo-700 text-[10px] font-extrabold">
              Base: {article.baseSize || 'M'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-indigo-900/70 mt-1 flex-wrap">
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block"></span>
              <strong>Tgt</strong>: Target Spek
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
              <strong>Akt</strong>: Ukur Sampel
            </span>
            <span className="flex items-center gap-1 font-mono text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              ✓ Pass (Sesuai)
            </span>
            <span className="flex items-center gap-1 font-mono text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              ⚠ Dev (Out of Spec)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowManageModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pilih & Kelola Variabel</span>
          </button>

          <button
            onClick={() => applyCategoryTemplate()}
            disabled={!hasCategoryTemplate}
            title={hasCategoryTemplate ? undefined : `Belum ada template variabel untuk kategori ${article.category}. Gunakan "Pilih & Kelola Variabel" untuk menambah manual.`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>Reset Template {article.category}</span>
          </button>
        </div>
      </div>

      {/* Category Template Recommendation Switcher Bar */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl space-y-2 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-extrabold flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
            Rekomendasi Variabel Size Chart Berdasarkan Kategori Garment:
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Kategori Aktif: <strong className="text-white underline">{article.category}</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { cat: 'T-Shirt / Shirt', icon: '👕', label: 'Kaos & Kemeja' },
            { cat: 'Jacket / Hoodie', icon: '🧥', label: 'Jaket & Outer' },
            { cat: 'Pants / Shorts', icon: '👖', label: 'Celana (Pants/Shorts)' },
            { cat: 'Skirt / Dress', icon: '👗', label: 'Dress & Rok' },
            { cat: 'Hat / Cap', icon: '🧢', label: 'Topi & Cap' },
            { cat: 'Bag / Backpack', icon: '🎒', label: 'Tas & Backpack' },
            { cat: 'Accessory / Custom', icon: '✂️', label: 'Custom / Aksesori' },
          ].map((item) => {
            const isCurrent = article.category === item.cat;
            return (
              <button
                key={item.cat}
                type="button"
                onClick={() => applyCategoryTemplate(item.cat as CategoryType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-[#087E79] text-white shadow-2xs ring-2 ring-emerald-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
                {isCurrent && <span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-mono">Aktif</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile/Desktop Mode Switcher */}
      <div className="sm:hidden flex items-center justify-between p-2 rounded-xl bg-slate-100 border border-slate-200">
        <span className="text-[11px] font-semibold text-slate-500">Mode Tampilan Mobile:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMobileMode('by_size')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              mobileMode === 'by_size' ? 'bg-[#087E79] text-white' : 'text-slate-500'
            }`}
          >
            Edit by Size
          </button>
          <button
            onClick={() => setMobileMode('full_matrix')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              mobileMode === 'full_matrix' ? 'bg-[#087E79] text-white' : 'text-slate-500'
            }`}
          >
            Full Matrix
          </button>
        </div>
      </div>

      {/* Mobile Edit by Size Mode */}
      {mobileMode === 'by_size' && (
        <div className="sm:hidden space-y-3">
          {/* Size Selector Tabs */}
          <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSizeIndex(Math.max(0, activeSizeIndex - 1))}
              disabled={activeSizeIndex === 0}
              className="p-1 rounded bg-slate-100 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            <span className="font-extrabold text-sm text-[#087E79]">
              Ukuran: {activeSize} {activeSize === article.baseSize ? '(Base Size)' : ''}
            </span>

            <button
              onClick={() => setActiveSizeIndex(Math.min(sizes.length - 1, activeSizeIndex + 1))}
              disabled={activeSizeIndex === sizes.length - 1}
              className="p-1 rounded bg-slate-100 disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Size Field Cards for active size */}
          {currentChart.length > 0 ? (
            <div className="space-y-2">
              {currentChart.map((row) => {
                const target = row.targetValues[activeSize] || 0;
                const actual = row.sampleActualValues?.[activeSize];
                const diff = actual !== undefined ? Number((actual - target).toFixed(1)) : null;
                const isPass = diff !== null ? Math.abs(diff) <= row.tolerance : null;

                return (
                  <div
                    key={row.fieldId}
                    className="p-3 rounded-xl bg-white border border-slate-200 space-y-2 shadow-2xs relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {row.fieldName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">±{row.tolerance} cm</span>
                        <button
                          onClick={() => handleRemoveRow(row.fieldId)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Keluarkan / Hapus Variabel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Target (cm)</span>
                        <input
                          type="number"
                          step="0.1"
                          value={target}
                          onChange={(e) => handleUpdateTargetValue(row.fieldId, activeSize, Number(e.target.value))}
                          className="w-full p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-center text-slate-900"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">Sampel Aktual (cm)</span>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.1"
                            value={actual !== undefined ? actual : ''}
                            placeholder="Belum diukur"
                            onChange={(e) => handleUpdateActualValue(row.fieldId, activeSize, Number(e.target.value))}
                            className={`w-full p-1.5 rounded-lg border text-xs font-bold text-center ${
                              isPass === true
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                                : isPass === false
                                ? 'border-rose-500 bg-rose-50 text-rose-800'
                                : 'border-slate-200 bg-white text-slate-900'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <p>Belum ada variabel pengukuran di size chart.</p>
              <button
                onClick={() => setShowManageModal(true)}
                className="px-3 py-1.5 bg-[#087E79] text-white rounded-lg font-bold text-xs"
              >
                + Pilih Variabel Pengukuran
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input / View Mode Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-700 ml-1">Modus Input Size Chart:</span>
          <div className="inline-flex rounded-lg bg-slate-200/80 p-0.5 font-bold text-xs">
            <button
              onClick={() => setViewMode('target')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'target'
                  ? 'bg-white text-[#087E79] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🎯 Target Spek (Satu Input)
            </button>
            <button
              onClick={() => setViewMode('actual')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'actual'
                  ? 'bg-white text-[#087E79] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📏 Hasil Ukur Sampel
            </button>
            <button
              onClick={() => setViewMode('dual')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'dual'
                  ? 'bg-white text-[#087E79] shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚡ Dual (Bandingkan)
            </button>
          </div>
        </div>

        <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
          {viewMode === 'target' && 'Menampilkan 1 kolom input Target Spek (cm) per ukuran.'}
          {viewMode === 'actual' && 'Menampilkan 1 kolom input Hasil Ukur Sampel (cm) vs Target.'}
          {viewMode === 'dual' && 'Menampilkan perbandingan Target & Hasil Ukur side-by-side.'}
        </span>
      </div>

      {/* Full Matrix View (Ultra-Dense Compact Layout) - Always Visible on Desktop (sm:block) */}
      <div className={`overflow-x-auto rounded-xl border border-slate-300 shadow-2xs bg-white ${mobileMode === 'full_matrix' ? 'block' : 'hidden sm:block'}`}>
          {currentChart.length > 0 ? (
            <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-300 font-extrabold select-none">
                  <th className="py-1 px-2 border-r border-slate-300 w-36 sm:w-44 text-[10px]">
                    Variabel Pengukuran (POM)
                  </th>
                  <th className="py-1 px-0.5 text-center border-r border-slate-300 w-10 text-[10px]">
                    Tol (±)
                  </th>
                  {sizes.map((sz) => {
                    const isBase = sz === article.baseSize;
                    return (
                      <th
                        key={sz}
                        className={`py-1 px-0.5 text-center border-r border-slate-300 ${
                          viewMode === 'dual' ? 'min-w-[54px]' : 'min-w-[40px]'
                        } ${isBase ? 'bg-[#DDF4F1]/70 text-[#087E79]' : ''}`}
                      >
                        <div className="font-extrabold text-[11px] flex items-center justify-center gap-0.5">
                          <span>{sz}</span>
                          {isBase && (
                            <span className="text-[7px] font-mono bg-[#087E79] text-white px-0.5 py-0 rounded-xs uppercase">
                              BASE
                            </span>
                          )}
                        </div>
                        <div className="text-[8px] font-bold text-slate-400 flex justify-center items-center gap-0.5 mt-0.5 font-mono">
                          {viewMode === 'target' && <span>Target</span>}
                          {viewMode === 'actual' && <span>Aktual</span>}
                          {viewMode === 'dual' && (
                            <>
                              <span title="Target Spesifikasi">Tgt</span>
                              <span className="text-slate-300">/</span>
                              <span title="Hasil Ukur Sampel">Akt</span>
                            </>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="py-1 px-0.5 text-center w-5 border-slate-300"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {currentChart.map((row, idx) => (
                  <tr
                    key={row.fieldId}
                    className={`${idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'} hover:bg-slate-100/60 transition-colors`}
                  >
                    <td className="py-0.5 px-1.5 font-bold text-slate-900 border-r border-slate-200 truncate max-w-[170px] text-[10px] sm:text-[11px]">
                      {row.fieldName}
                    </td>
                    <td className="py-0.5 px-0.5 text-center text-slate-500 font-mono text-[9px] border-r border-slate-200 bg-slate-50/80">
                      ±{row.tolerance}
                    </td>
                    {sizes.map((sz) => {
                      const target = row.targetValues[sz] || 0;
                      const actual = row.sampleActualValues?.[sz];
                      const diff = actual !== undefined ? Number((actual - target).toFixed(1)) : null;
                      const isPass = diff !== null ? Math.abs(diff) <= row.tolerance : null;
                      const isBase = sz === article.baseSize;

                      return (
                        <td
                          key={sz}
                          className={`py-0.5 px-0.2 text-center border-r border-slate-200 ${
                            isBase ? 'bg-teal-50/20' : ''
                          }`}
                        >
                          {viewMode === 'target' && (
                            <input
                              type="number"
                              step="0.1"
                              value={target || ''}
                              onChange={(e) =>
                                handleUpdateTargetValue(row.fieldId, sz, Number(e.target.value))
                              }
                              className="w-9 py-0.5 px-0.5 border border-slate-200 bg-slate-50/80 rounded-md text-center font-mono font-bold text-[10px] text-slate-900 focus:bg-white focus:border-[#087E79] focus:outline-none transition-all shadow-2xs"
                            />
                          )}

                          {viewMode === 'actual' && (
                            <input
                              type="number"
                              step="0.1"
                              value={actual !== undefined ? actual : ''}
                              placeholder={target ? String(target) : '-'}
                              onChange={(e) =>
                                handleUpdateActualValue(row.fieldId, sz, Number(e.target.value))
                              }
                              className={`w-9 py-0.5 px-0.5 border rounded-md text-center font-mono font-bold text-[10px] focus:outline-none transition-all shadow-2xs ${
                                isPass === true
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-black'
                                  : isPass === false
                                  ? 'border-rose-500 bg-rose-100 text-rose-900 font-black'
                                  : 'border-slate-200 bg-white text-slate-700'
                              }`}
                            />
                          )}

                          {viewMode === 'dual' && (
                            <div className="flex items-center justify-center gap-0.5">
                              <input
                                type="number"
                                step="0.1"
                                value={target || ''}
                                onChange={(e) =>
                                  handleUpdateTargetValue(row.fieldId, sz, Number(e.target.value))
                                }
                                className="w-7 py-0.2 px-0.2 border border-slate-200 bg-slate-50/80 rounded text-center font-mono font-bold text-[9px] text-slate-900 focus:bg-white focus:border-[#087E79] focus:outline-none transition-all"
                              />
                              <span className="text-slate-300 text-[8px] font-mono">/</span>
                              <input
                                type="number"
                                step="0.1"
                                value={actual !== undefined ? actual : ''}
                                placeholder="-"
                                onChange={(e) =>
                                  handleUpdateActualValue(row.fieldId, sz, Number(e.target.value))
                                }
                                className={`w-7 py-0.2 px-0.2 border rounded text-center font-mono font-bold text-[9px] focus:outline-none transition-all ${
                                  isPass === true
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-black'
                                    : isPass === false
                                    ? 'border-rose-500 bg-rose-100 text-rose-900 font-black'
                                    : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              />
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-0.5 px-0.5 text-center">
                      <button
                        onClick={() => handleRemoveRow(row.fieldId)}
                        className="p-0.5 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Keluarkan / Hapus Variabel (X)"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Summary Evaluation Row */}
                <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-[9px]">
                  <td className="py-1 px-2 text-slate-800 uppercase font-extrabold border-r border-slate-300">
                    Evaluasi QC Fitting:
                  </td>
                  <td className="py-1 px-1 text-center text-slate-400 font-mono border-r border-slate-300">
                    -
                  </td>
                  {sizes.map((sz) => {
                    let totalMeasured = 0;
                    let passCount = 0;
                    currentChart.forEach((r) => {
                      const tgt = r.targetValues[sz] || 0;
                      const act = r.sampleActualValues?.[sz];
                      if (act !== undefined) {
                        totalMeasured++;
                        if (Math.abs(act - tgt) <= r.tolerance) {
                          passCount++;
                        }
                      }
                    });

                    const allPass = totalMeasured > 0 && passCount === totalMeasured;

                    return (
                      <td key={sz} className="py-1 px-0.5 text-center border-r border-slate-300 font-mono">
                        {totalMeasured === 0 ? (
                          <span className="text-slate-400 font-normal text-[8px]">-</span>
                        ) : allPass ? (
                          <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[8px]">
                            {passCount}/{totalMeasured} Pass
                          </span>
                        ) : (
                          <span className="px-1 py-0.2 rounded bg-rose-100 text-rose-800 font-extrabold text-[8px]">
                            {passCount}/{totalMeasured} ({totalMeasured - passCount} Dev)
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-1 px-0.5 border-slate-300"></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center bg-slate-50 text-xs text-slate-500 space-y-3">
              <p>Belum ada variabel pengukuran di size chart.</p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setShowManageModal(true)}
                  className="px-3 py-1.5 bg-[#087E79] text-white rounded-lg font-bold text-xs hover:bg-[#066864] transition-colors shadow-2xs"
                >
                  + Pilih Variabel Pengukuran
                </button>
                {hasCategoryTemplate && (
                  <button
                    onClick={() => applyCategoryTemplate()}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    Terapkan Template {article.category}
                  </button>
                )}
              </div>
              {!hasCategoryTemplate && (
                <p className="text-[11px] text-slate-400 italic">
                  Belum ada template variabel untuk kategori "{article.category}". Tambahkan variabel secara manual.
                </p>
              )}
            </div>
          )}
        </div>

      {/* Modal: Kelola & Pilih Variabel Pengukuran */}
      {showManageModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-lg border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#087E79]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Kelola & Pilih Variabel Pengukuran
                </h3>
              </div>
              <button
                onClick={() => setShowManageModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Active Variables List */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] font-extrabold text-slate-700 block">
                  Variabel Aktif Saat Ini ({currentChart.length}):
                </span>
                {currentChart.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {currentChart.map((row) => (
                      <span
                        key={row.fieldId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 shadow-2xs"
                      >
                        <span>{row.fieldName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">±{row.tolerance}cm</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.fieldId)}
                          className="text-slate-400 hover:text-rose-600 transition-colors ml-0.5 cursor-pointer"
                          title="Keluarkankan / Hapus variabel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada variabel aktif.</p>
                )}
              </div>

              {/* Category Filter Tabs & Search Bar inside Modal */}
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold text-slate-800 block">
                    Pilih Variabel Berdasarkan Kategori Garment:
                  </span>

                  {/* Search Input Box */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      placeholder="Cari variabel (misal: Dada)..."
                      className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#087E79] focus:outline-none shadow-2xs"
                    />
                    {modalSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setModalSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills inside Modal */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {[
                    { id: 'RECOMMENDED', label: `✨ Rekomendasi (${article.category})` },
                    { id: 'T-Shirt / Shirt', label: '👕 Kaos & Kemeja' },
                    { id: 'Jacket / Hoodie', label: '🧥 Jaket & Outer' },
                    { id: 'Pants / Shorts', label: '👖 Celana' },
                    { id: 'Skirt / Dress', label: '👗 Dress & Rok' },
                    { id: 'Hat / Cap', label: '🧢 Topi & Cap' },
                    { id: 'Bag / Backpack', label: '🎒 Tas & Backpack' },
                    { id: 'Accessory / Custom', label: '✂️ Custom' },
                    { id: 'ALL', label: '🌐 Semua Variabel' },
                  ].map((tab) => {
                    const isSelected = modalCategoryFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setModalCategoryFilter(tab.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#087E79] text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtered Variable Cards Grid Grouped Cleanly */}
              {(() => {
                let targetList: MeasurementField[] = [];

                if (modalCategoryFilter === 'RECOMMENDED') {
                  targetList = categoryFields;
                } else if (modalCategoryFilter === 'ALL') {
                  targetList = MEASUREMENT_FIELDS;
                } else {
                  targetList = MEASUREMENT_FIELDS.filter((f) => f.category === modalCategoryFilter);
                }

                if (modalSearchQuery.trim()) {
                  const q = modalSearchQuery.toLowerCase().trim();
                  targetList = targetList.filter(
                    (f) =>
                      f.labelId.toLowerCase().includes(q) ||
                      f.aliasEn.toLowerCase().includes(q) ||
                      f.code.toLowerCase().includes(q) ||
                      f.category.toLowerCase().includes(q)
                  );
                }

                const renderFieldCard = (field: MeasurementField) => {
                  const isAdded = activeFieldIds.has(field.id) || activeFieldNames.has(field.labelId);
                  return (
                    <div
                      key={field.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isAdded
                          ? 'bg-emerald-50/70 border-emerald-300 text-slate-700 shadow-2xs font-semibold'
                          : 'bg-white border-slate-200 hover:border-[#087E79] text-slate-800'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 leading-tight">{field.labelId}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                              field.importance === 'Required'
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : field.importance === 'Recommended'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {field.importance}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 block truncate mt-0.5" title={field.measurementMethod}>
                          <span className="font-mono text-emerald-700 font-bold">±{field.defaultTolerance}cm</span> • {field.measurementMethod}
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                          Kategori: <strong>{field.category}</strong>
                        </span>
                      </div>
                      {isAdded ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 border border-emerald-200">
                          ✓ Aktif
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleAddPresetField(field)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#087E79] text-white text-[11px] font-bold hover:bg-[#066864] transition-colors shrink-0 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah</span>
                        </button>
                      )}
                    </div>
                  );
                };

                if (targetList.length === 0) {
                  return (
                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <p className="text-xs font-semibold text-slate-500">
                        Tidak ada variabel pengukuran yang cocok dengan pencarian / tab filter Anda.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setModalCategoryFilter('ALL');
                          setModalSearchQuery('');
                        }}
                        className="mt-2 text-xs font-extrabold text-[#087E79] underline hover:text-[#066864]"
                      >
                        Tampilkan Semua Variabel
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {targetList.map((field) => renderFieldCard(field))}
                  </div>
                );
              })()}

              {/* Add Custom Field Form */}
              <form onSubmit={handleAddCustomField} className="pt-3 border-t border-slate-200 space-y-2">
                <span className="text-[11px] font-extrabold text-slate-800 block uppercase">
                  ➕ Tambah Variabel Pengukuran Custom Baru:
                </span>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Misal: Lebar Kelim Bawah / Tingkat Kerung Lengan"
                    value={customFieldName}
                    onChange={(e) => setCustomFieldName(e.target.value)}
                    className="flex-1 p-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:border-[#087E79] focus:outline-none shadow-2xs"
                  />
                  <div className="w-full sm:w-28 shrink-0 flex items-center gap-1 bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">±</span>
                    <input
                      type="number"
                      step="0.1"
                      value={customTolerance}
                      onChange={(e) => setCustomTolerance(Number(e.target.value))}
                      className="w-full text-xs font-bold text-center bg-transparent focus:outline-none text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">cm</span>
                  </div>
                  <button
                    type="submit"
                    disabled={!customFieldName.trim()}
                    className="px-3.5 py-2 bg-[#087E79] text-white font-bold text-xs rounded-xl hover:bg-[#066864] disabled:opacity-50 transition-colors shrink-0 shadow-2xs cursor-pointer"
                  >
                    + Tambah
                  </button>
                </div>
              </form>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowManageModal(false)}
                className="px-4 py-1.5 bg-[#087E79] text-white hover:bg-[#066864] font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
