/**
 * Product Launch OS 3.0 - Operational Reports & KPI Analytics
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Layers,
} from 'lucide-react';
import { Article } from '../../types';
import { formatIDR } from '../../utils/calculations';

interface ReportsViewProps {
  articles: Article[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ articles }) => {
  const [copiedReport, setCopiedReport] = useState(false);

  const totalArticles = articles.length;
  const onTrackCount = articles.filter(a => a.scheduleHealth === 'On Track').length;
  const atRiskCount = articles.filter(a => a.scheduleHealth === 'At Risk' || a.scheduleHealth === 'Overdue').length;

  const totalCalculatedHPP = articles.reduce((sum, a) => sum + (a.calculatedHPP || 0), 0);
  const totalTargetHPP = articles.reduce((sum, a) => sum + (a.targetHPP || 0), 0);
  const hppVariance = totalTargetHPP > 0 ? ((totalCalculatedHPP - totalTargetHPP) / totalTargetHPP) * 100 : 0;

  const productionQuantity = (article: Article) => {
    const selectedScenario = article.scenarios?.find((scenario) => scenario.isSelectedPlan);
    if (selectedScenario?.totalQty) return selectedScenario.totalQty;
    return article.batches?.reduce((sum, batch) => sum + batch.totalTargetQty, 0) || 0;
  };
  const totalRevenueTarget = articles.reduce(
    (sum, article) => sum + (article.targetPriceMSRP || 0) * productionQuantity(article),
    0,
  );
  const totalProjectedCost = articles.reduce(
    (sum, article) => sum + (article.calculatedHPP || 0) * productionQuantity(article),
    0,
  );
  const projectedGrossMargin = totalRevenueTarget > 0
    ? ((totalRevenueTarget - totalProjectedCost) / totalRevenueTarget) * 100
    : 0;

  // Stage distribution
  const stageCounts: Record<string, number> = {};
  articles.forEach((a) => {
    stageCounts[a.stage] = (stageCounts[a.stage] || 0) + 1;
  });

  const handleExportCSV = () => {
    const headers = 'Kode,Nama Artikel,Kategori,Unit Bisnis,Tahap,Kesehatan,HPP Kalkulasi,MSRP Target\n';
    const rows = articles
      .map(
        (a) =>
          `"${a.code}","${a.name}","${a.category}","${a.businessUnit}","${a.stage}","${a.scheduleHealth}",${a.calculatedHPP},${a.targetPriceMSRP}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PLOS_Executive_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 3000);
  };

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#087E79]" />
            <h1 className="text-lg font-extrabold text-slate-900">
              Laporan Kinerja & KPI Operasional Realtime
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Analisis siklus waktu pengembangan, variansi HPP, dan kesehatan pipa produksi seluruh artikel.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-all shadow-2xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{copiedReport ? '✓ CSV Berhasil Diunduh!' : 'Ekspor Laporan CSV'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500">Total Artikel Pipa</span>
          <span className="text-2xl font-black text-slate-900 block">{totalArticles} Artikel</span>
          <span className="text-[10px] text-emerald-700 font-bold block">
            {onTrackCount} On-Track ({Math.round((onTrackCount / (totalArticles || 1)) * 100)}%)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500">Total Komitmen HPP</span>
          <span className="text-xl font-black text-[#087E79] block font-mono">
            {formatIDR(totalCalculatedHPP)}
          </span>
          <span className="text-[10px] text-slate-500 block">Akumulasi seluruh bahan & CMT</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500">Variansi HPP vs Target</span>
          <span
            className={`text-2xl font-black block font-mono ${
              hppVariance <= 0 ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {hppVariance > 0 ? `+${hppVariance.toFixed(1)}%` : `${hppVariance.toFixed(1)}%`}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {hppVariance <= 0 ? 'HPP Efisien di bawah batas' : 'HPP Sedikit melebihi target initial'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500">Kesehatan Pipa Rilis</span>
          <span className="text-2xl font-black text-slate-900 block font-mono">
            {atRiskCount > 0 ? `${atRiskCount} Hambatan` : '100% On-Track'}
          </span>
          <span className="text-[10px] text-rose-700 font-bold block">
            {atRiskCount > 0 ? 'Memerlukan mitigasi blocker' : 'Seluruh jadwal aman'}
          </span>
        </div>
      </div>

      {/* Stage Breakdown & Financial Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-[#087E79]" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Distribusi Stage Pengembangan
            </h3>
          </div>

          <div className="space-y-2.5">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <div key={stage} className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">{stage}</span>
                  <span className="text-[#087E79] font-mono">{count} Artikel</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#087E79] rounded-full transition-all"
                    style={{ width: `${(count / totalArticles) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <TrendingUp className="w-4 h-4 text-[#087E79]" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Proyeksi Gross Margin & Revenue dari Rencana Aktif
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium block">Estimasi Gross Revenue Potential</span>
              <span className="text-lg font-black text-slate-900 font-mono block">
                {formatIDR(totalRevenueTarget)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium block">Proyeksi Rata-rata Gross Margin</span>
              <span className="text-lg font-black text-emerald-700 font-mono block">
                {projectedGrossMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
