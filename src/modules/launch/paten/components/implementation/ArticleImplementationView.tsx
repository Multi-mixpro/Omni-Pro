/**
 * Product Launch OS 3.0 - Article Implementation View (Implementasi Artikel / Post-R&D Launch OS)
 * Handles Steps 8 to 14: HPP Costing, QC Readiness, Stock Allocation, Mass Production, Launch Copy, Tasks & Techpack Files
 */

import React, { useState } from 'react';
import {
  DollarSign,
  ShieldCheck,
  Grid,
  Factory,
  Rocket,
  CheckSquare,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';
import {
  Article,
  MaterialMaster,
  Supplier,
  ServiceMaster,
  ProgressUpdate,
} from '../../types';

import { HPPPanel } from '../workspace/panels/HPPPanel';
import { ReadinessPanel } from '../workspace/panels/ReadinessPanel';
import { StockMatrixPanel } from '../workspace/panels/StockMatrixPanel';
import { ProductionPanel } from '../workspace/panels/ProductionPanel';
import { LaunchPanel } from '../workspace/panels/LaunchPanel';
import { TasksPanel } from '../workspace/panels/TasksPanel';
import { FilesPanel } from '../workspace/panels/FilesPanel';

import { formatIDR, calculateHPP } from '../../utils/calculations';

interface ArticleImplementationViewProps {
  articles: Article[];
  selectedArticleId: string;
  onSelectArticleId: (id: string) => void;
  masterMaterials: MaterialMaster[];
  masterSuppliers: Supplier[];
  masterServices: ServiceMaster[];
  updates: ProgressUpdate[];
  onUpdateArticle: (updated: Article) => void;
  onAddUpdate: (update: ProgressUpdate) => void;
  onNavigateToDetail: () => void;
  currentUserName?: string;
  currentUserAvatar?: string | null;
  /** Indikator status autosave (lembar kerja tidak memakai tombol Simpan). */
  saveStatus?: React.ReactNode;
}

interface ImplementationPhaseConfig {
  id: string;
  phaseNum: number;
  title: string;
  subtitle: string;
  colorTheme: {
    accentBar: string;
    headerBg: string;
    headerBgOpen: string;
    border: string;
    iconBg: string;
    iconText: string;
    badge: string;
    titleText: string;
  };
  panelKeys: string[];
}

const IMPLEMENTATION_PHASES: ImplementationPhaseConfig[] = [
  {
    id: 'impl-phase-1',
    phaseNum: 1,
    title: 'PROSES 1: KALKULASI HPP & GERBANG KELAYAKAN QC',
    subtitle: 'Simulasi HPP, margin profit, biaya CMT & persetujuan readiness gate produksi',
    colorTheme: {
      accentBar: 'bg-amber-600',
      headerBg: 'bg-amber-50/60 hover:bg-amber-100/70',
      headerBgOpen: 'bg-amber-50/90 border-b border-amber-200',
      border: 'border-amber-200 border-l-4 border-l-amber-600',
      iconBg: 'bg-amber-600 text-white',
      iconText: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      titleText: 'text-amber-950',
    },
    panelKeys: ['hpp', 'readiness'],
  },
  {
    id: 'impl-phase-2',
    phaseNum: 2,
    title: 'PROSES 2: ALOKASI STOK & EKSEKUSI PRODUKSI MASSAL',
    subtitle: 'Matriks alokasi SKU, anggaran modal & pemantauan batch cutting/sewing vendor',
    colorTheme: {
      accentBar: 'bg-emerald-600',
      headerBg: 'bg-emerald-50/60 hover:bg-emerald-100/70',
      headerBgOpen: 'bg-emerald-50/90 border-b border-emerald-200',
      border: 'border-emerald-200 border-l-4 border-l-emerald-600',
      iconBg: 'bg-emerald-700 text-white',
      iconText: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      titleText: 'text-emerald-950',
    },
    panelKeys: ['stock', 'production'],
  },
  {
    id: 'impl-phase-3',
    phaseNum: 3,
    title: 'PROSES 3: PELUNCURAN KOMERSIAL & OPERASIONAL TECHPACK',
    subtitle: 'Copywriting katalog rilis, tugas operasional tim & arsip riwayat diskusi',
    colorTheme: {
      accentBar: 'bg-rose-600',
      headerBg: 'bg-rose-50/60 hover:bg-rose-100/70',
      headerBgOpen: 'bg-rose-50/90 border-b border-rose-200',
      border: 'border-rose-200 border-l-4 border-l-rose-600',
      iconBg: 'bg-rose-600 text-white',
      iconText: 'text-rose-800',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      titleText: 'text-rose-950',
    },
    panelKeys: ['launch', 'tasks', 'files'],
  },
];

/** Status pengisian panel implementasi, dihitung dari data artikel. */
type ImplTone = 'complete' | 'partial' | 'empty';
function getImplPanelState(key: string, article: Article): { label: string; tone: ImplTone } {
  switch (key) {
    case 'hpp':
      return (article.calculatedHPP ?? 0) > 0
        ? { label: 'HPP terkalkulasi', tone: 'complete' }
        : { label: 'Perlu diisi', tone: 'empty' };
    case 'readiness': {
      const done = (article.readinessChecklist ?? []).filter((r) => r.isCompleted).length;
      const total = (article.readinessChecklist ?? []).length;
      if (total > 0 && done >= total) return { label: 'Gate lolos', tone: 'complete' };
      if (done > 0) return { label: `${done}/${total} checklist`, tone: 'partial' };
      return { label: 'Perlu diisi', tone: 'empty' };
    }
    case 'stock': {
      const hasPlan = (article.scenarios ?? []).some((s) => s.isSelectedPlan);
      if (hasPlan) return { label: 'Rencana dipilih', tone: 'complete' };
      return (article.scenarios ?? []).length > 0
        ? { label: 'Draf skenario', tone: 'partial' }
        : { label: 'Perlu diisi', tone: 'empty' };
    }
    case 'production':
      return (article.batches ?? []).length > 0
        ? { label: `${article.batches.length} batch`, tone: 'complete' }
        : { label: 'Belum ada batch', tone: 'empty' };
    case 'launch':
      return (article.copywriting && article.copywriting.trim()) || (article.sellingPoints ?? []).length > 0
        ? { label: 'Materi siap', tone: 'complete' }
        : { label: 'Perlu diisi', tone: 'empty' };
    case 'files': {
      const fileCount = (article.files ?? []).length;
      return fileCount > 0
        ? { label: `${fileCount} berkas`, tone: 'complete' }
        : { label: 'Belum ada berkas', tone: 'empty' };
    }
    case 'tasks':
    default:
      return { label: 'Aktif', tone: 'partial' };
  }
}

const IMPL_TONE_CLASS: Record<ImplTone, string> = {
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  empty: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const ArticleImplementationView: React.FC<ArticleImplementationViewProps> = ({
  articles,
  selectedArticleId,
  onSelectArticleId,
  masterMaterials,
  masterSuppliers,
  masterServices,
  updates,
  onUpdateArticle,
  onAddUpdate,
  onNavigateToDetail,
  currentUserName,
  currentUserAvatar,
  saveStatus,
}) => {
  const article = articles.find((a) => a.id === selectedArticleId) || articles[0];

  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    hpp: false,
    readiness: false,
    stock: false,
    production: false,
    launch: false,
    tasks: false,
    files: false,
  });

  if (!article) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Tidak ada artikel yang dipilih untuk implementasi.
      </div>
    );
  }

  const togglePanel = (key: string) => {
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExpandAll = () => {
    const allOpened: Record<string, boolean> = {};
    panelsConfig.forEach((p) => {
      allOpened[p.key] = true;
    });
    setOpenPanels(allOpened);
  };

  const handleCollapseAll = () => {
    const allClosed: Record<string, boolean> = {};
    panelsConfig.forEach((p) => {
      allClosed[p.key] = false;
    });
    setOpenPanels(allClosed);
  };

  const totalHPP = calculateHPP(article);
  const targetMargin = article.targetPriceMSRP > 0 ? Math.round(((article.targetPriceMSRP - totalHPP) / article.targetPriceMSRP) * 100) : 0;
  const readinessCount = (article.readinessChecklist || []).filter((r) => r.isCompleted).length;
  const totalReadiness = (article.readinessChecklist || []).length || 10;
  const isReadinessPassed = readinessCount >= totalReadiness;

  const totalQty = (article.scenarios || [])
    .find((scenario) => scenario.isSelectedPlan)
    ?.matrix.reduce((sum, cell) => sum + cell.plannedQty, 0) || 500;
  const totalProductionBudget = totalQty * totalHPP;

  const panelsConfig = [
    {
      key: 'hpp',
      phaseId: 'impl-phase-1',
      title: '8. HPP & Simulasi Harga',
      subtitle: 'Kalkulasi HPP, jasa CMT, margin profit & simulasi harga jual',
      icon: DollarSign,
      component: (
        <HPPPanel
          article={article}
          masterServices={masterServices}
          onUpdateArticle={onUpdateArticle}
        />
      ),
    },
    {
      key: 'readiness',
      phaseId: 'impl-phase-1',
      title: '9. Gerbang Kelayakan QC',
      subtitle: 'Checklist gate kelayakan produksi massal & standar kelulusan QC',
      icon: ShieldCheck,
      component: <ReadinessPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'stock',
      phaseId: 'impl-phase-2',
      title: '10. Matriks Stok & Anggaran',
      subtitle: 'Matriks warna x ukuran x kuantitas & kalkulasi anggaran modal',
      icon: Grid,
      component: <StockMatrixPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'production',
      phaseId: 'impl-phase-2',
      title: '11. Eksekusi Batch Produksi',
      subtitle: 'Pemantauan batch produksi & vendor jahit/cutting',
      icon: Factory,
      component: <ProductionPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'launch',
      phaseId: 'impl-phase-3',
      title: '12. Rilis & Materi Pemasaran',
      subtitle: 'Copywriting katalog, selling points & persiapan rilis pasar',
      icon: Rocket,
      component: <LaunchPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'tasks',
      phaseId: 'impl-phase-3',
      title: '13. Tugas & Progres Tim',
      subtitle: 'Timeline, log aktivitas & update progres tim',
      icon: CheckSquare,
      component: <TasksPanel article={article} updates={updates} onAddUpdate={onAddUpdate} currentUserName={currentUserName} currentUserAvatar={currentUserAvatar} />,
    },
    {
      key: 'files',
      phaseId: 'impl-phase-3',
      title: '14. Berkas & Riwayat Diskusi',
      subtitle: 'Dokumen pendukung, techpack & riwayat instruksi',
      icon: FileText,
      component: <FilesPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-2.5 sm:p-4 space-y-4 text-xs text-slate-900">
      {/* Top Main Article Selector & Overview Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-600 shrink-0">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold uppercase tracking-wider">
                  Post-Development OS
                </span>
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Implementasi & Eksekusi Artikel
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-[11px] text-slate-500">
                  Modul HPP, Kelayakan Produksi, Matriks Stok, Batch Produksi, Pemasaran & Files Techpack (Proses 8–14).
                </p>
                {saveStatus}
              </div>
            </div>
          </div>

          {/* Article Picker Dropdown */}
          <label className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 transition-colors cursor-pointer">
            <PackageCheck className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0 hidden sm:inline">Artikel:</span>
            <select
              value={article.id}
              onChange={(e) => onSelectArticleId(e.target.value)}
              className="paten-select-bare text-slate-900 text-xs font-extrabold pr-1 py-0.5 focus:outline-none cursor-pointer max-w-[220px] sm:max-w-none"
            >
              {articles.map((art) => (
                <option key={art.id} value={art.id}>
                  {art.code} - {art.name} ({art.stage})
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* 4 Implementation KPI Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 border-t border-slate-100">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/60 p-3 rounded-2xl border border-emerald-200">
            <span className="text-[10px] text-emerald-900/70 font-bold block">Target HPP / Pcs</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-extrabold font-mono text-emerald-800">
                {formatIDR(totalHPP)}
              </span>
              <span className="text-[10px] text-emerald-700/70 font-bold">
                (Margin {targetMargin}%)
              </span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border bg-gradient-to-br ${
            isReadinessPassed
              ? 'from-teal-50 to-teal-100/60 border-teal-200'
              : 'from-amber-50 to-amber-100/60 border-amber-200'
          }`}>
            <span className={`text-[10px] font-bold block ${isReadinessPassed ? 'text-teal-900/70' : 'text-amber-900/70'}`}>
              QC Readiness Gate
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                  isReadinessPassed ? 'bg-white text-teal-700' : 'bg-white text-amber-700'
                }`}
              >
                {readinessCount}/{totalReadiness} Checklist
              </span>
              {isReadinessPassed ? (
                <span className="text-teal-700 text-[10px] font-bold">✓ Ready</span>
              ) : (
                <span className="text-amber-700 text-[10px] font-bold">Pending</span>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-50 to-sky-100/60 p-3 rounded-2xl border border-sky-200">
            <span className="text-[10px] text-sky-900/70 font-bold block">Alokasi Stok & Modal</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-extrabold font-mono text-sky-950">
                {totalQty} Pcs
              </span>
              <span className="text-[10px] text-sky-700/70 font-mono">
                ({formatIDR(totalProductionBudget)})
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100/60 p-3 rounded-2xl border border-violet-200">
            <span className="text-[10px] text-violet-900/70 font-bold block">Status Rilis & Pemasaran</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-2 py-0.5 rounded-full bg-white text-violet-700 font-mono text-[10px] font-extrabold">
                {article.stage === 'Launch' ? 'Rilis Aktif' : 'Persiapan Rilis'}
              </span>
            </div>
          </div>
        </div>

        {/* Global Expand & Action Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExpandAll}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors"
            >
              Buka Semua Panel (7)
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-colors"
            >
              Tutup Semua
            </button>
          </div>

          <button
            onClick={onNavigateToDetail}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#087E79] hover:bg-[#066864] text-white text-[10px] sm:text-[11px] font-extrabold transition-all shadow-2xs cursor-pointer shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lihat Techpack Terintegrasi</span>
            <span className="sm:hidden">Techpack</span>
          </button>
        </div>
      </div>

      {/* Sequential 7 Implementation Panels Grouped into 3 Process Phases */}
      <div className="space-y-5">
        {IMPLEMENTATION_PHASES.map((phase) => {
          const phasePanels = panelsConfig.filter((p) => p.phaseId === phase.id);
          const theme = phase.colorTheme;

          return (
            <div key={phase.id} className="space-y-2">
              {/* Distinct Phase Header Banner */}
              <div className="pt-2 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-200 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${theme.accentBar} shrink-0`} />
                  <h2 className={`font-extrabold text-xs sm:text-sm tracking-wide ${theme.titleText}`}>
                    {phase.title}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${theme.badge}`}>
                    {phasePanels.length} Lembar Kerja
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium pl-5 sm:pl-0">
                  {phase.subtitle}
                </p>
              </div>

              {/* Accordions */}
              <div className="space-y-2">
                {phasePanels.map((p) => {
                  const Icon = p.icon;
                  const isOpen = !!openPanels[p.key];
                  const panelState = getImplPanelState(p.key, article);

                  return (
                    <div
                      key={p.key}
                      className={`bg-white rounded-xl overflow-hidden shadow-2xs transition-all ${theme.border}`}
                    >
                      {/* Panel Header */}
                      <div
                        onClick={() => togglePanel(p.key)}
                        className={`px-3 sm:px-3.5 py-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                          isOpen ? theme.headerBgOpen : theme.headerBg
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 shadow-2xs ${theme.iconBg}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-xs text-slate-900 truncate">
                              {p.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 font-medium truncate">
                              {p.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${IMPL_TONE_CLASS[panelState.tone]}`}>
                            {panelState.tone === 'complete' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <span className={`w-1.5 h-1.5 rounded-full ${panelState.tone === 'partial' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                            )}
                            <span>{panelState.label}</span>
                          </span>

                          {isOpen ? (
                            <ChevronUp className="w-4 h-4 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Panel Body */}
                      {isOpen && (
                        <div className="p-3 sm:p-4 bg-white space-y-3 border-t border-slate-100">
                          {p.component}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span className="text-[10px] font-medium text-slate-400">
                              Selesai mengolah data {p.title}?
                            </span>
                            <button
                              onClick={() => togglePanel(p.key)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all border border-slate-200 cursor-pointer"
                            >
                              <ChevronUp className="w-3 h-3 text-slate-600" />
                              <span>Tutup Panel</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
