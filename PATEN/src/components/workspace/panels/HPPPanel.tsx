/**
 * Product Launch OS 3.0 - Workspace Panel: HPP & Pricing
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Lock,
  Unlock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
} from 'lucide-react';
import { Article, CostComponent, ServiceMaster } from '../../../types';
import { formatIDR, calculateBOMTotal, calculateHPP } from '../../../utils/calculations';
import { ConfirmDeleteButton } from '../../shared/ConfirmDeleteButton';

interface HPPPanelProps {
  article: Article;
  masterServices: ServiceMaster[];
  onUpdateArticle: (updated: Article) => void;
}

export const HPPPanel: React.FC<HPPPanelProps> = ({
  article,
  masterServices,
  onUpdateArticle,
}) => {
  const [msrp, setMsrp] = useState(article.targetPriceMSRP || 499000);
  const [showAddCmtModal, setShowAddCmtModal] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(masterServices[0]?.id || '');
  const [customAmount, setCustomAmount] = useState(15000);

  const bomTotal = calculateBOMTotal(article.materials || []);

  const currentHPP = calculateHPP(article);
  const marginPercent = msrp > 0 ? Number((((msrp - currentHPP) / msrp) * 100).toFixed(1)) : 0;

  const handleAddCMT = () => {
    const srv = masterServices.find((s) => s.id === selectedServiceId);
    if (!srv) return;

    const newComp: CostComponent = {
      id: crypto.randomUUID(),
      name: srv.name,
      category: 'CMT & Service',
      calculationMethod: srv.calculationMethod,
      amount: customAmount || srv.defaultRate,
      isIncluded: true,
      isCustom: false,
    };

    const updatedComps = [...(article.costComponents || []), newComp];
    onUpdateArticle({
      ...article,
      costComponents: updatedComps,
      calculatedHPP: calculateHPP({ ...article, costComponents: updatedComps }),
      lastUpdated: new Date().toISOString(),
    });

    setShowAddCmtModal(false);
  };

  const handleToggleComponent = (compId: string) => {
    const updated = (article.costComponents || []).map((c) =>
      c.id === compId ? { ...c, isIncluded: !c.isIncluded } : c
    );
    onUpdateArticle({
      ...article,
      costComponents: updated,
      calculatedHPP: calculateHPP({ ...article, costComponents: updated }),
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleRemoveComponent = (compId: string) => {
    const updated = (article.costComponents || []).filter((c) => c.id !== compId);
    onUpdateArticle({
      ...article,
      costComponents: updated,
      calculatedHPP: calculateHPP({ ...article, costComponents: updated }),
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleLockHPP = () => {
    onUpdateArticle({
      ...article,
      costConfidence: 'Locked - Production',
      calculatedHPP: currentHPP,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleUnlockHPP = () => {
    onUpdateArticle({
      ...article,
      costConfidence: 'Medium - Quoted',
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleSaveMsrp = () => {
    const projectedMargin = msrp > 0
      ? Number((((msrp - currentHPP) / msrp) * 100).toFixed(1))
      : 0;
    onUpdateArticle({
      ...article,
      targetPriceMSRP: msrp,
      priceSimulation: {
        ...article.priceSimulation,
        suggestedMSRP: msrp,
        projectedGrossMarginPercent: projectedMargin,
      },
      calculatedHPP: currentHPP,
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-3 text-xs text-slate-900">
      {/* HPP Top Summary Banner */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-white text-emerald-700 font-bold text-[10px]">
              {article.costConfidence || 'Medium - Quoted'}
            </span>
            <span className="text-[11px] text-emerald-900/70 font-medium">HPP Versi Terkini</span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-xl font-mono font-extrabold text-emerald-800">{formatIDR(currentHPP)}</span>
            <span className="text-[11px] text-emerald-700/70 font-mono">
              Target: {formatIDR(article.targetHPP)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {article.costConfidence === 'Locked - Production' ? (
            <button
              type="button"
              onClick={handleUnlockHPP}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-50 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>HPP Terkunci (Locked)</span>
              <Unlock className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleLockHPP}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-colors shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci HPP Versi Produksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Cost Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left: Component Breakdown Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-900">
              Rincian Komponen Biaya Produksi
            </h3>
            <button
              onClick={() => setShowAddCmtModal(true)}
              className="flex items-center gap-1 text-xs font-bold text-[#087E79] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah CMT / Jasa</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {/* BOM Material Fixed Item */}
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">
                  BOM Material & Trimmings
                </span>
                <span className="text-[10px] text-slate-500">Otomatis dari tabel BOM</span>
              </div>
              <span className="font-mono font-bold text-[#087E79]">
                {formatIDR(bomTotal)}
              </span>
            </div>

            {/* Other CMT / Overhead Components */}
            {(article.costComponents || [])
              .filter((c) => c.category !== 'Material')
              .map((comp) => (
                <div
                  key={comp.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                    comp.isIncluded
                      ? 'bg-white border-slate-200 shadow-2xs'
                      : 'bg-slate-50 opacity-60 border-dashed border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={comp.isIncluded}
                      onChange={() => handleToggleComponent(comp.id)}
                      className="rounded text-[#087E79]"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {comp.name}
                      </span>
                      <span className="text-[10px] text-slate-500">{comp.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900">
                      {formatIDR(comp.amount)}
                    </span>
                    <ConfirmDeleteButton
                      onConfirm={() => handleRemoveComponent(comp.id)}
                      label={`Hapus ${comp.name}`}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Right: Pricing Simulator & Gross Margin */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-xs text-slate-900">
              Simulasi Harga Jual & Proyeksi Margin
            </h3>
            <Sparkles className="w-4 h-4 text-[#087E79]" />
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 text-[11px] font-semibold mb-1">
                Harga Retail Jual (MSRP / Tag Price)
              </label>
              <input
                type="number"
                value={msrp}
                onChange={(e) => setMsrp(Number(e.target.value))}
                onBlur={handleSaveMsrp}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono font-bold text-sm text-slate-900 focus:border-[#087E79] focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-[#DDF4F1]/60 border border-[#087E79]/20 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">HPP Produksi Fix</span>
                <span className="font-mono font-bold text-slate-900">{formatIDR(currentHPP)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Laba Kotor Per Unit</span>
                <span className="font-mono font-bold text-emerald-700">{formatIDR(msrp - currentHPP)}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1.5 border-t border-[#087E79]/20">
                <span className="font-bold text-slate-900">Proyeksi Gross Margin %</span>
                <span className="font-mono font-extrabold text-sm text-[#087E79]">{marginPercent}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Harga Grosir (Wholesale)</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatIDR(Math.round(msrp * 0.55))}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block">Harga Reseller</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatIDR(Math.round(msrp * 0.70))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add CMT Modal */}
      {showAddCmtModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-slate-900">
              Tambah Komponen Biaya CMT / Jasa
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Pilih Master Service CMT
                </label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => {
                    setSelectedServiceId(e.target.value);
                    const srv = masterServices.find((s) => s.id === e.target.value);
                    if (srv) setCustomAmount(srv.defaultRate);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900"
                >
                  {masterServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({formatIDR(s.defaultRate)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Biaya per Unit (IDR)
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowAddCmtModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={handleAddCMT}
                className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864]"
              >
                Tambahkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
