/**
 * Product Launch OS 3.0 - Workspace Panel: Stock & Production Budget Matrix
 */

import React, { useState } from 'react';
import {
  Grid,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Article, MatrixCell, ProductionScenario } from '../../../types';
import { formatIDR, calculateMatrixTotals } from '../../../utils/calculations';

interface StockMatrixPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const StockMatrixPanel: React.FC<StockMatrixPanelProps> = ({
  article,
  onUpdateArticle,
}) => {
  const [activeScenarioName, setActiveScenarioName] = useState<'Base' | 'Conservative' | 'Aggressive'>('Base');

  const colorways = article.colorways || [];
  const sizes = article.sizeSet || [];
  const currentHPP = article.calculatedHPP || 0;
  const currentMSRP = article.targetPriceMSRP || 0;
  const isReady = colorways.length > 0 && sizes.length > 0 && currentHPP > 0;

  // Active scenario or initialize empty
  const activeScenario = article.scenarios?.find((s) => s.name === activeScenarioName) || {
    id: `sc-${activeScenarioName}`,
    name: activeScenarioName,
    matrix: [],
    totalQty: 0,
    totalBudget: 0,
    totalRevenue: 0,
    grossMarginPercent: 70,
    isSelectedPlan: true,
  };

  const getCellQty = (colorId: string, sizeCode: string) => {
    const cell = activeScenario.matrix.find((c) => c.colorId === colorId && c.sizeCode === sizeCode);
    return cell ? cell.plannedQty : 0;
  };

  const handleUpdateCellQty = (colorId: string, sizeCode: string, qty: number) => {
    const existing = [...activeScenario.matrix];
    const index = existing.findIndex((c) => c.colorId === colorId && c.sizeCode === sizeCode);

    const cellBudget = qty * currentHPP;
    const cellRevenue = qty * currentMSRP;

    if (index >= 0) {
      existing[index] = { colorId, sizeCode, plannedQty: qty, cellBudget, cellRevenue };
    } else {
      existing.push({ colorId, sizeCode, plannedQty: qty, cellBudget, cellRevenue });
    }

    const { totalQty, totalBudget, totalRevenue, grossMarginPercent } = calculateMatrixTotals(existing);

    const updatedScenario: ProductionScenario = {
      ...activeScenario,
      matrix: existing,
      totalQty,
      totalBudget,
      totalRevenue,
      grossMarginPercent,
    };

    const updatedScenarios = (article.scenarios || []).filter((s) => s.name !== activeScenarioName);
    updatedScenarios.push(updatedScenario);

    onUpdateArticle({
      ...article,
      scenarios: updatedScenarios,
      lastUpdated: new Date().toISOString(),
    });
  };

  const { totalQty, totalBudget, totalRevenue, grossMarginPercent } = calculateMatrixTotals(activeScenario.matrix);

  return (
    <div className="space-y-4 text-xs text-slate-900">
      {/* Top Banner: Budget Totals & Scenario Switcher */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-slate-900">
                Total Rencana Produksi: {totalQty} Unit
              </span>
              <span className="px-2 py-0.5 rounded bg-[#DDF4F1] text-[#087E79] text-[10px] font-bold">
                HPP Ref: {formatIDR(currentHPP)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Matriks perencanaan kuantitas per kombinasi Warna × Ukuran.
            </p>
          </div>

          {/* Scenario Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
            {(['Conservative', 'Base', 'Aggressive'] as const).map((scName) => (
              <button
                key={scName}
                onClick={() => setActiveScenarioName(scName)}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  activeScenarioName === scName
                    ? 'bg-[#087E79] text-white font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {scName}
              </button>
            ))}
          </div>
        </div>

        {/* Totals Summary Ribbon */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 text-[11px] block">Modal Produksi (Budget)</span>
            <span className="font-mono font-extrabold text-slate-900">
              {formatIDR(totalBudget)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Potensi Omzet (MSRP)</span>
            <span className="font-mono font-extrabold text-[#087E79]">
              {formatIDR(totalRevenue)}
            </span>
          </div>

          <div>
            <span className="text-slate-500 text-[11px] block">Gross Margin %</span>
            <span className="font-mono font-extrabold text-emerald-700">
              {grossMarginPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Matrix Grid Table */}
      {!isReady ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-xs text-slate-500 space-y-1">
          <p className="font-bold text-slate-700">Data belum lengkap untuk menghitung matriks anggaran.</p>
          <p>
            Lengkapi dulu: {colorways.length === 0 && 'Varian Warna (Colors & Variants)'}
            {colorways.length === 0 && (sizes.length === 0 || currentHPP <= 0) && ', '}
            {sizes.length === 0 && 'Size Chart'}
            {sizes.length === 0 && currentHPP <= 0 && ', '}
            {currentHPP <= 0 && 'HPP (panel Costing / HPP)'}
          </p>
        </div>
      ) : (
      <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <th className="py-2.5 px-3">Varian Warna</th>
              {sizes.map((sz) => (
                <th key={sz} className="py-2.5 px-3 text-center font-bold text-[#087E79]">
                  {sz}
                </th>
              ))}
              <th className="py-2.5 px-3 text-right">Subtotal Qty</th>
              <th className="py-2.5 px-3 text-right">Subtotal Biaya</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {colorways.map((col) => {
              let colorRowQty = 0;
              sizes.forEach((sz) => {
                colorRowQty += getCellQty(col.id, sz);
              });
              const colorRowBudget = colorRowQty * currentHPP;

              return (
                <tr key={col.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0 shadow-2xs"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </div>
                  </td>

                  {sizes.map((sz) => {
                    const qty = getCellQty(col.id, sz);

                    return (
                      <td key={sz} className="py-2 px-2 text-center">
                        <input
                          type="number"
                          value={qty || ''}
                          placeholder="0"
                          onChange={(e) => handleUpdateCellQty(col.id, sz, Number(e.target.value))}
                          className="w-14 py-1 rounded border border-slate-200 bg-white text-center text-xs font-mono font-bold text-slate-900 focus:border-[#087E79] focus:outline-none"
                        />
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {colorRowQty} pcs
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#087E79]">
                    {formatIDR(colorRowBudget)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};
