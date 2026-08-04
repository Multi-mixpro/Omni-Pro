/**
 * Product Launch OS 3.0 - Dashboard View
 */

import React from 'react';
import {
  Kanban,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Article, ApprovalGate, DecisionRequest, BlockerItem, BusinessUnit, ArticleStage } from '../../types';
import { isAllBusinessUnits } from '../../services/businessUnits';
import { formatIDR } from '../../utils/calculations';
import { stageBadgeClass, stageDotClass } from '../../utils/stageStyles';
import { optimizedImageUrl } from '../../utils/cloudinary';

interface DashboardViewProps {
  articles: Article[];
  pendingApprovals: ApprovalGate[];
  decisions: DecisionRequest[];
  blockers: BlockerItem[];
  activeBusinessUnit: BusinessUnit;
  onOpenArticle: (articleId: string, initialTab?: 'brief' | 'detail' | 'workspace') => void;
  onSelectTab: (tab: string) => void;
  onOpenQuickCreate?: () => void;
  canCreate?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  articles = [],
  pendingApprovals = [],
  decisions = [],
  blockers = [],
  activeBusinessUnit = 'Mainline Studio',
  onOpenArticle,
  onSelectTab,
  onOpenQuickCreate,
  canCreate = false,
}) => {
  // Filter articles by active business unit
  const filteredArticles = (articles || []).filter(
    (a) => isAllBusinessUnits(activeBusinessUnit) || a.businessUnit === activeBusinessUnit
  );

  const activeCount = filteredArticles.filter((a) => a.status === 'Active' || a.status === 'In Production').length;
  const prospectCount = filteredArticles.filter((a) => a.stage === 'Prospect').length;
  const atRiskCount = filteredArticles.filter((a) => a.scheduleHealth === 'At Risk' || a.scheduleHealth === 'Overdue' || a.blockerCount > 0).length;
  const readyProdCount = filteredArticles.filter((a) => a.productionReadiness === 'Approved' || a.productionReadiness === 'Ready').length;

  const totalPlannedBudget = filteredArticles.reduce((sum, a) => {
    const activePlan = a.scenarios?.find((s) => s.isSelectedPlan) || a.scenarios?.[0];
    return sum + (activePlan?.totalBudget || 0);
  }, 0);

  const hppAboveTargetCount = filteredArticles.filter(
    (a) => a.calculatedHPP > a.targetHPP && a.targetHPP > 0
  ).length;

  // --- Konteks tambahan agar KPI terbaca sebagai ukuran, bukan sekadar angka ---
  const totalArticles = filteredArticles.length;
  const pct = (n: number) => (totalArticles > 0 ? Math.round((n / totalArticles) * 100) : 0);

  /** Rata-rata kelengkapan data seluruh artikel pada unit aktif. */
  const avgCompleteness = totalArticles > 0
    ? Math.round(
        filteredArticles.reduce((sum, a) => sum + (a.dataCompletenessPercent || 0), 0) / totalArticles,
      )
    : 0;

  /** Tenggat rilis yang jatuh dalam 30 hari ke depan, terdekat lebih dulu. */
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingDeadlines = filteredArticles
    .map((a) => {
      if (!a.targetReleaseDate) return null;
      const due = new Date(a.targetReleaseDate);
      if (Number.isNaN(due.getTime())) return null;
      const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
      return { article: a, days };
    })
    .filter((entry): entry is { article: Article; days: number } => entry !== null)
    .sort((a, b) => a.days - b.days);

  const dueSoonCount = upcomingDeadlines.filter((d) => d.days >= 0 && d.days <= 30).length;
  const overdueCount = upcomingDeadlines.filter((d) => d.days < 0).length;

  /** Sebaran artikel per tahap, untuk melihat di mana pipeline menumpuk. */
  const STAGE_ORDER: ArticleStage[] = [
    'Prospect', 'Specification', 'Source & Pattern', 'Sampling',
    'Costing', 'Production Plan', 'Production', 'Launch',
  ];
  const stageDistribution = STAGE_ORDER.map((stage) => ({
    stage,
    count: filteredArticles.filter((a) => a.stage === stage).length,
  })).filter((entry) => entry.count > 0);

  const safeApprovals = pendingApprovals || [];
  const safeBlockers = blockers || [];
  const safeDecisions = decisions || [];

  return (
    <div className="space-y-4 pb-10">
      {/* Greeting Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="px-2 py-0.5 rounded-md bg-[#087E79]/10 text-[#087E79] font-mono">
              {activeBusinessUnit}
            </span>
            <span>• Studio Dashboard</span>
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
            Pusat Kendali Peluncuran Produk
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {activeCount} artikel aktif berjalan. {safeApprovals.length} approval dan {safeBlockers.length} blocker pending.
          </p>
        </div>

        {canCreate && onOpenQuickCreate && (
          <button
            onClick={onOpenQuickCreate}
            className="paten-primary-action px-4 py-2 text-white font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tambah Artikel</span>
          </button>
        )}
      </div>

      {/* Action Required Priority Queue */}
      {(safeApprovals.length > 0 || safeDecisions.length > 0 || safeBlockers.length > 0) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <h2 className="font-extrabold text-xs text-slate-900">
                  Tindakan Dibutuhkan (Action Required)
                </h2>
                <p className="text-[11px] text-slate-500 font-medium">
                  Keputusan, approval, dan blocker yang menahan laju produksi
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectTab && onSelectTab('approvals')}
              className="text-xs font-bold text-[#087E79] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Approvals Pending Card */}
            {safeApprovals.slice(0, 2).map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectTab && onSelectTab('approvals')}
                className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 hover:border-amber-400 cursor-pointer transition-all space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="text-[#087E79]">{app.articleCode}</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[10px]">
                    {app.gateType}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {app.summaryNote}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Requested by {app.requestedBy}
                </span>
              </div>
            ))}

            {/* Blockers Card */}
            {safeBlockers.slice(0, 2).map((blk) => (
              <div
                key={blk.id}
                onClick={() => onSelectTab && onSelectTab('tasks')}
                className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 hover:border-rose-400 cursor-pointer transition-all space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                  <span className="text-rose-700">{blk.articleCode}</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px]">
                    {blk.severity} Blocker
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 line-clamp-1">
                  {blk.title}
                </p>
                <span className="text-[10px] text-slate-500 block">
                  Owner: {blk.ownerName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Articles */}
        <div
          onClick={() => onSelectTab('pipeline')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100/60 border border-sky-200 hover:border-sky-400 cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-900/70">Artikel Aktif</span>
            <span className="p-1.5 rounded-full bg-white text-sky-600 shadow-2xs">
              <Kanban className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-950">{activeCount}</span>
            <span className="text-[11px] text-sky-700/60 font-medium">/ {filteredArticles.length} total</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
            <div className="h-full rounded-full bg-sky-600" style={{ width: `${pct(activeCount)}%` }} />
          </div>
          <p className="text-[10px] text-sky-700 font-bold mt-1">
            {pct(activeCount)}% aktif · {prospectCount} prospek baru
          </p>
        </div>

        {/* At Risk & Overdue */}
        <div
          onClick={() => onSelectTab('pipeline')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 hover:border-amber-400 cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900/70">At Risk / Overdue</span>
            <span className="p-1.5 rounded-full bg-white text-amber-600 shadow-2xs">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-800">{atRiskCount}</span>
            <span className="text-[11px] text-amber-700/60 font-medium">artikel</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
            <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct(atRiskCount)}%` }} />
          </div>
          <p className="text-[10px] font-bold mt-1 text-rose-600">
            {safeBlockers.length} blocker · {overdueCount} lewat tenggat
          </p>
        </div>

        {/* Ready For Production */}
        <div
          onClick={() => onSelectTab('pipeline')}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200 hover:border-emerald-400 cursor-pointer transition-all shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900/70">Siap Produksi</span>
            <span className="p-1.5 rounded-full bg-white text-emerald-600 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">{readyProdCount}</span>
            <span className="text-[11px] text-emerald-700/60 font-medium">artikel</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct(readyProdCount)}%` }} />
          </div>
          <p className="text-[10px] text-emerald-700 font-bold mt-1">
            Readiness Gate lulus · rata-rata data {avgCompleteness}%
          </p>
        </div>

        {/* Planned Budget */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/60 border border-violet-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-900/70">Anggaran Produksi</span>
            <span className="p-1.5 rounded-full bg-white text-violet-600 shadow-2xs">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-lg font-black text-violet-950 font-mono">
              {formatIDR(totalPlannedBudget)}
            </span>
          </div>
          <p className="text-[10px] text-violet-700 font-medium mt-0.5">
            {hppAboveTargetCount > 0 ? `${hppAboveTargetCount} artikel HPP melebihi target` : 'HPP sesuai budget'}
          </p>
        </div>
      </div>

      {/* Sebaran tahap & tenggat — memperlihatkan di mana pipeline menumpuk dan
          apa yang jatuh tempo, bukan hanya jumlah total. */}
      {totalArticles > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Distribusi tahap */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="font-extrabold text-xs text-slate-900">Sebaran Tahap Pipeline</h2>
              <span className="text-[10px] font-mono text-slate-400">{totalArticles} artikel</span>
            </div>

            {/* Bar proporsi bertingkat */}
            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-slate-100">
              {stageDistribution.map((entry) => (
                <div
                  key={entry.stage}
                  className={stageDotClass(entry.stage)}
                  style={{ width: `${pct(entry.count)}%` }}
                  title={`${entry.stage}: ${entry.count} artikel`}
                />
              ))}
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2.5">
              {stageDistribution.map((entry) => (
                <button
                  key={entry.stage}
                  onClick={() => onSelectTab('pipeline')}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full ${stageDotClass(entry.stage)}`} />
                  <span>{entry.stage}</span>
                  <span className="font-mono text-slate-400">{entry.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tenggat terdekat */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-extrabold text-xs text-slate-900">Tenggat Terdekat</h2>
              <span className="text-[10px] font-mono text-slate-400">{dueSoonCount} dalam 30 hari</span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">Belum ada target rilis terjadwal.</p>
            ) : (
              <div className="space-y-1.5">
                {upcomingDeadlines.slice(0, 4).map(({ article: art, days }) => (
                  <button
                    key={art.id}
                    onClick={() => onOpenArticle(art.id, 'workspace')}
                    className="w-full flex items-center justify-between gap-2 p-2 rounded-xl border border-slate-100 bg-slate-50/60 hover:border-[#087E79] transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono font-bold text-[#087E79] truncate">{art.code}</div>
                      <div className="text-[10px] text-slate-500 truncate">{art.targetReleaseDate}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                        days < 0
                          ? 'bg-rose-100 text-rose-700'
                          : days <= 7
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {days < 0 ? `${Math.abs(days)} hr lewat` : days === 0 ? 'Hari ini' : `${days} hr lagi`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Article Pipeline Overview Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-sm text-slate-900">
              Status Artikel Terbaru
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Akses cepat ke Brief, Detail, atau Workspace Artikel
            </p>
          </div>

          <button
            onClick={() => onSelectTab('pipeline')}
            className="text-xs font-bold text-[#087E79] hover:underline flex items-center gap-1"
          >
            <span>Lihat Semua Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-[#087E79] hover:shadow-2xs transition-all flex flex-col justify-between"
            >
              {/* Card Body */}
              <div className="p-3 space-y-2">
                <div className="flex items-start gap-2.5">
                  <img
                    src={optimizedImageUrl(art.mainImage, 56)}
                    alt={art.name}
                    className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-mono font-bold text-[#087E79] truncate">
                        {art.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${stageBadgeClass(art.stage)}`}>
                        {art.stage}
                      </span>
                    </div>

                    <h3 className="font-bold text-xs text-slate-900 truncate mt-0.5">
                      {art.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate">
                      {art.category} · {art.seasonCollection}
                    </p>
                  </div>
                </div>

                {/* Workflow Progress */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Workflow Progress</span>
                    <span className="font-bold text-slate-900">
                      {art.workflowProgressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#087E79] h-full rounded-full transition-all"
                      style={{ width: `${art.workflowProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Direct 3 Actions Footer */}
              <div className="px-2.5 py-1.5 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-1 text-center text-[11px] font-bold">
                <button
                  onClick={() => onOpenArticle(art.id, 'brief')}
                  className="py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#087E79] hover:border-[#087E79] transition-colors"
                >
                  Brief
                </button>
                <button
                  onClick={() => onOpenArticle(art.id, 'detail')}
                  className="py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#087E79] hover:border-[#087E79] transition-colors"
                >
                  Detail
                </button>
                <button
                  onClick={() => onOpenArticle(art.id, 'workspace')}
                  className="py-1 rounded-lg bg-[#087E79] text-white hover:bg-[#066864] transition-colors font-bold shadow-2xs"
                >
                  Workspace
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
