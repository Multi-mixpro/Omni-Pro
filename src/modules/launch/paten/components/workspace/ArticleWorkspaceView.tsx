/**
 * Product Launch OS 3.0 - Article Development Workspace View (R&D & Spesifikasi Artikel: Steps 1 to 7)
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Package,
  Palette,
  Ruler,
  Target,
  Building2,
  CheckCircle2,
  Zap,
  Rocket,
  ArrowRight,
  Pencil,
} from 'lucide-react';
import { Article, MaterialMaster, Supplier, ServiceMaster, ProgressUpdate, ArticleStage } from '../../types';
import { stageBadgeClass } from '../../utils/stageStyles';

import { BriefPanel } from './panels/BriefPanel';
import { MaterialsPanel } from './panels/MaterialsPanel';
import { ColorsPanel } from './panels/ColorsPanel';
import { SizeChartPanel } from './panels/SizeChartPanel';
import { SuppliersPanel } from './panels/SuppliersPanel';
import { PatternPanel } from './panels/PatternPanel';
import { SamplingPanel } from './panels/SamplingPanel';

interface ArticleWorkspaceViewProps {
  article: Article;
  masterMaterials: MaterialMaster[];
  masterSuppliers: Supplier[];
  masterServices: ServiceMaster[];
  updates: ProgressUpdate[];
  onUpdateArticle: (updated: Article) => void;
  onAddUpdate: (update: ProgressUpdate) => void;
  onNavigateToDetail: () => void;
  onNavigateToImplementation?: () => void;
  /** Indikator status autosave (workspace tidak memakai tombol Simpan). */
  saveStatus?: React.ReactNode;
  /** Membuka form data dasar artikel (nama, kategori, target, colorway, dll). */
  onEditArticle?: (articleId: string) => void;
}

interface ProcessPhaseConfig {
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
    dividerLine: string;
    titleText: string;
  };
  panelKeys: string[];
}

const PROCESS_PHASES: ProcessPhaseConfig[] = [
  {
    id: 'phase-1',
    phaseNum: 1,
    title: 'PROSES 1: KONSEP & SPESIFIKASI PRODUK',
    subtitle: 'Tahap perancangan brief, varian warna SKU, dan spesifikasi ukuran (Size Chart)',
    colorTheme: {
      accentBar: 'bg-indigo-600',
      headerBg: 'bg-indigo-50/60 hover:bg-indigo-100/70',
      headerBgOpen: 'bg-indigo-50/90 border-b border-indigo-200',
      border: 'border-indigo-200 border-l-4 border-l-indigo-600',
      iconBg: 'bg-indigo-600 text-white',
      iconText: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      dividerLine: 'border-indigo-200',
      titleText: 'text-indigo-950',
    },
    panelKeys: ['brief', 'colors', 'sizes'],
  },
  {
    id: 'phase-2',
    phaseNum: 2,
    title: 'PROSES 2: SOURCING MATERIAL & KONSTRUKSI',
    subtitle: 'Tahap penentuan bahan BOM, vendor supplier, serta efisiensi pola & marker',
    colorTheme: {
      accentBar: 'bg-teal-600',
      headerBg: 'bg-teal-50/60 hover:bg-teal-100/70',
      headerBgOpen: 'bg-teal-50/90 border-b border-teal-200',
      border: 'border-teal-200 border-l-4 border-l-teal-600',
      iconBg: 'bg-teal-700 text-white',
      iconText: 'text-teal-700',
      badge: 'bg-teal-100 text-teal-800 border-teal-300',
      dividerLine: 'border-teal-200',
      titleText: 'text-teal-950',
    },
    panelKeys: ['materials', 'suppliers', 'pattern'],
  },
  {
    id: 'phase-3',
    phaseNum: 3,
    title: 'PROSES 3: SAMPLING & FITTING HASIL UKUR',
    subtitle: 'Tahap iterasi sampel V1/V2, fitting aktual & pencatatan revisi pola',
    colorTheme: {
      accentBar: 'bg-amber-600',
      headerBg: 'bg-amber-50/60 hover:bg-amber-100/70',
      headerBgOpen: 'bg-amber-50/90 border-b border-amber-200',
      border: 'border-amber-200 border-l-4 border-l-amber-600',
      iconBg: 'bg-amber-600 text-white',
      iconText: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      dividerLine: 'border-amber-200',
      titleText: 'text-amber-950',
    },
    panelKeys: ['sampling'],
  },
];

/** Status pengisian satu panel, dihitung dari data artikel yang sebenarnya. */
type PanelTone = 'complete' | 'partial' | 'empty';
interface PanelState {
  label: string;
  tone: PanelTone;
}

function getPanelState(key: string, article: Article): PanelState {
  const count = (n?: number) => n ?? 0;
  switch (key) {
    case 'brief': {
      const filled = [article.briefIntent, article.targetUserDescription, article.acceptanceCriteria]
        .filter((t) => t && t.trim()).length;
      if (filled >= 2) return { label: 'Lengkap', tone: 'complete' };
      if (filled >= 1) return { label: 'Sebagian', tone: 'partial' };
      return { label: 'Perlu diisi', tone: 'empty' };
    }
    case 'colors':
      return count(article.colorways?.length) > 0
        ? { label: `${article.colorways.length} warna`, tone: 'complete' }
        : { label: 'Perlu diisi', tone: 'empty' };
    case 'sizes': {
      const sizes = count(article.sizeSet?.length);
      const chart = count(article.sizeChart?.length);
      if (sizes > 0 && chart > 0) return { label: `${sizes} size · chart siap`, tone: 'complete' };
      if (sizes > 0) return { label: 'Chart belum diisi', tone: 'partial' };
      return { label: 'Perlu diisi', tone: 'empty' };
    }
    case 'materials':
      return count(article.materials?.length) > 0
        ? { label: `${article.materials.length} item BOM`, tone: 'complete' }
        : { label: 'Perlu diisi', tone: 'empty' };
    case 'suppliers': {
      const withSup = (article.materials ?? []).filter((m) => m.supplierId).length;
      return withSup > 0
        ? { label: `${withSup} tersumber`, tone: 'complete' }
        : { label: 'Perlu diisi', tone: 'empty' };
    }
    case 'pattern':
      return article.patternSpecification
        ? { label: 'Terisi', tone: 'complete' }
        : { label: 'Perlu diisi', tone: 'empty' };
    case 'sampling':
      return count(article.sampleIterations?.length) > 0
        ? { label: `${article.sampleIterations.length} iterasi`, tone: 'complete' }
        : { label: 'Perlu diisi', tone: 'empty' };
    default:
      return { label: 'Aktif', tone: 'partial' };
  }
}

const PANEL_TONE_CLASS: Record<PanelTone, string> = {
  complete: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border-amber-200',
  empty: 'bg-slate-100 text-slate-500 border-slate-200',
};

export const ArticleWorkspaceView: React.FC<ArticleWorkspaceViewProps> = ({
  article,
  masterMaterials,
  masterSuppliers,
  masterServices,
  updates,
  onUpdateArticle,
  onAddUpdate,
  onNavigateToDetail,
  onNavigateToImplementation,
  saveStatus,
  onEditArticle,
}) => {
  // State for opening/closing the 7 development panels (closed by default)
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    brief: false,
    colors: false,
    sizes: false,
    materials: false,
    suppliers: false,
    pattern: false,
    sampling: false,
  });

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

  const handleStageChange = (newStage: ArticleStage) => {
    onUpdateArticle({
      ...article,
      stage: newStage,
      lastUpdated: new Date().toISOString(),
    });
  };

  const panelsConfig = [
    {
      key: 'brief',
      phaseId: 'phase-1',
      title: '1. Brief & Arah Produk',
      subtitle: 'Arah produk, target pengguna, kriteria kelulusan & referensi',
      icon: Target,
      component: <BriefPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'colors',
      phaseId: 'phase-1',
      title: '2. Warna & Varian (SKU)',
      subtitle: 'Varian warna, Pantone, swatch & kombinasi SKU',
      icon: Palette,
      component: <ColorsPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'sizes',
      phaseId: 'phase-1',
      title: '3. Ukuran & Size Chart',
      subtitle: 'Spesifikasi ukuran, template rekomendasi kategori & kelola variabel',
      icon: Ruler,
      component: <SizeChartPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'materials',
      phaseId: 'phase-2',
      title: '4. Material & Aksesori (BOM)',
      subtitle: 'Pilihan kain, trimming & kalkulasi BOM',
      icon: Package,
      component: (
        <MaterialsPanel
          article={article}
          masterMaterials={masterMaterials}
          masterSuppliers={masterSuppliers}
          onUpdateArticle={onUpdateArticle}
        />
      ),
    },
    {
      key: 'suppliers',
      phaseId: 'phase-2',
      title: '5. Sumber & Supplier',
      subtitle: 'Perbandingan supplier, lead time, MOQ & pemilihan sumber',
      icon: Building2,
      component: (
        <SuppliersPanel
          article={article}
          masterSuppliers={masterSuppliers}
          masterMaterials={masterMaterials}
          onUpdateArticle={onUpdateArticle}
        />
      ),
    },
    {
      key: 'pattern',
      phaseId: 'phase-2',
      title: '6. Pola & Efisiensi Marker',
      subtitle: 'Versi pola, drafter, efisiensi marker & konsumsi kain',
      icon: Layers,
      component: <PatternPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
    {
      key: 'sampling',
      phaseId: 'phase-3',
      title: '7. Sampel & Fitting',
      subtitle: 'Iterasi sampel V1/V2, pengukuran aktual & temuan defect',
      icon: Layers,
      component: <SamplingPanel article={article} onUpdateArticle={onUpdateArticle} />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-2.5 sm:p-4 space-y-3.5 text-xs text-slate-900">
      {/* Article Header & Control Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-violet-100 text-violet-600 shrink-0">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[11px] text-slate-400 font-bold">{article.code}</span>
                <h2 className="font-extrabold text-xs sm:text-sm text-slate-900">{article.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageBadgeClass(article.stage)}`}>
                  {article.stage}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-[11px] text-slate-500">
                  7 Lembar Kerja R&D Development Produk (Concept to Sampling).
                </p>
                {saveStatus}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onEditArticle && (
              <button
                onClick={() => onEditArticle(article.id)}
                title="Edit data dasar artikel (nama, kategori, target, colorway, ukuran)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 text-[10px] sm:text-[11px] font-bold transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Data Artikel</span>
              </button>
            )}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleExpandAll}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] sm:text-[11px] font-bold text-slate-700 transition-colors"
              >
                Buka Semua (7)
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[10px] sm:text-[11px] font-bold text-slate-700 transition-colors"
              >
                Tutup Semua
              </button>
            </div>

            <button
              onClick={onNavigateToDetail}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#087E79] hover:bg-[#066864] text-white text-[10px] sm:text-[11px] font-bold transition-all shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hasil Terintegrasi</span>
            </button>
          </div>
        </div>

        {/* Indicator Strip — 5 indikator utama artikel (konsisten dgn kartu Pipeline) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-3 border-t border-slate-100">
          {/* Workflow progress */}
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Workflow</div>
            <div className="text-sm font-extrabold text-slate-900">{article.workflowProgressPercent}%</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-[#087E79]" style={{ width: `${article.workflowProgressPercent}%` }} />
            </div>
          </div>
          {/* Data completeness */}
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kelengkapan Data</div>
            <div className="text-sm font-extrabold text-slate-900">{article.dataCompletenessPercent}%</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${article.dataCompletenessPercent}%` }} />
            </div>
          </div>
          {/* Schedule health */}
          <div className={`p-2.5 rounded-xl border ${
            article.scheduleHealth === 'On Track' ? 'bg-emerald-50 border-emerald-200'
              : article.scheduleHealth === 'At Risk' ? 'bg-amber-50 border-amber-200'
              : article.scheduleHealth === 'Overdue' || article.scheduleHealth === 'Blocked' ? 'bg-rose-50 border-rose-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Jadwal</div>
            <div className="text-[11px] font-extrabold text-slate-900 mt-0.5 leading-tight">{article.scheduleHealth}</div>
          </div>
          {/* Cost confidence */}
          <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Kepercayaan Biaya</div>
            <div className="text-[11px] font-extrabold text-slate-900 mt-0.5 leading-tight">{article.costConfidence}</div>
          </div>
          {/* Production readiness */}
          <div className={`p-2.5 rounded-xl border ${
            article.productionReadiness === 'Approved' || article.productionReadiness === 'Ready' ? 'bg-emerald-50 border-emerald-200'
              : article.productionReadiness === 'Conditional' ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Kesiapan Produksi</div>
            <div className="text-[11px] font-extrabold text-slate-900 mt-0.5 leading-tight">{article.productionReadiness}</div>
          </div>
        </div>

        {/* Article Stage Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
          <span className="text-slate-500 font-bold">Ubah Stage Development:</span>
          <select
            value={article.stage}
            onChange={(e) => handleStageChange(e.target.value as ArticleStage)}
            className="paten-pill w-full sm:w-auto bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold px-3 py-1.5 border border-slate-200 focus:outline-none focus:border-[#087E79] cursor-pointer transition-colors"
          >
            <option value="Prospect">Step 1: Prospect</option>
            <option value="Specification">Step 2: Specification</option>
            <option value="Source & Pattern">Step 3: Source & Pattern</option>
            <option value="Sampling">Step 4: Sampling</option>
          </select>
        </div>
      </div>

      {/* Sequential 7 Panels grouped by 3 Process Phases */}
      <div className="space-y-6">
        {PROCESS_PHASES.map((phase) => {
          const phasePanels = panelsConfig.filter((p) => p.phaseId === phase.id);
          const theme = phase.colorTheme;

          return (
            <div key={phase.id} className="space-y-2">
              {/* Distinct Process Phase Header Banner */}
              <div className="pt-2 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b pb-2 mb-2">
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

              {/* Accordion Panels */}
              <div className="space-y-2">
                {phasePanels.map((p) => {
                  const Icon = p.icon;
                  const isOpen = !!openPanels[p.key];
                  const panelState = getPanelState(p.key, article);

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
                          <div
                            className={`p-1.5 sm:p-2 rounded-lg shrink-0 shadow-2xs ${theme.iconBg}`}
                          >
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
                          <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${PANEL_TONE_CLASS[panelState.tone]}`}>
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
                              Selesai mengisi {p.title}?
                            </span>
                            <button
                              onClick={() => togglePanel(p.key)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-all border border-slate-200 shadow-2xs cursor-pointer"
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

      {/* Post-Sampling Link Banner to Implementasi Artikel */}
      {onNavigateToImplementation && (
        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/60 border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white text-orange-600 shadow-2xs shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-orange-950">
                Proses 8–14: Implementasi & Eksekusi Artikel
              </h3>
              <p className="text-[11px] text-orange-900/70 mt-0.5">
                Kalkulasi HPP, Gate Kelayakan QC, Matriks Stok, Eksekusi Produksi & Marketing Copy telah dipindahkan ke menu khusus.
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateToImplementation}
            className="px-4 py-2 rounded-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <span>Buka Implementasi Artikel</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
