/**
 * Product Launch OS 3.0 - Article Pipeline View
 */

import React, { useState } from 'react';
import {
  Grid,
  List,
  Kanban as KanbanIcon,
  Search,
  Pencil,
  Plus,
} from 'lucide-react';
import { Article, ArticleStage, BusinessUnit } from '../../types';
import { formatIDR } from '../../utils/calculations';
import { stageBadgeClass, stageDotClass } from '../../utils/stageStyles';
import { ConfirmDeleteButton } from '../shared/ConfirmDeleteButton';

interface ArticlePipelineViewProps {
  articles: Article[];
  activeBusinessUnit: BusinessUnit;
  onOpenArticle: (articleId: string, initialTab?: 'brief' | 'detail' | 'workspace') => void;
  onDeleteArticle?: (articleId: string) => void;
  onEditArticle?: (articleId: string) => void;
  onOpenQuickCreate?: () => void;
  canCreate?: boolean;
}

export const ArticlePipelineView: React.FC<ArticlePipelineViewProps> = ({
  articles,
  activeBusinessUnit,
  onOpenArticle,
  onDeleteArticle,
  onEditArticle,
  onOpenQuickCreate,
  canCreate = false,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('All');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<string>('All');
  const [savedView, setSavedView] = useState<string>('all');

  const STAGES: ArticleStage[] = [
    'Prospect',
    'Specification',
    'Source & Pattern',
    'Sampling',
    'Costing',
    'Production Plan',
    'Production',
    'Launch',
  ];

  // Filter logic
  const filteredArticles = articles.filter((a) => {
    if (a.businessUnit !== activeBusinessUnit) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = a.name.toLowerCase().includes(q);
      const matchCode = a.code.toLowerCase().includes(q);
      const matchCategory = a.category.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCategory) return false;
    }
    if (selectedStageFilter !== 'All' && a.stage !== selectedStageFilter) return false;
    if (selectedHealthFilter !== 'All' && a.scheduleHealth !== selectedHealthFilter) return false;

    if (savedView === 'at_risk') {
      return a.scheduleHealth === 'At Risk' || a.scheduleHealth === 'Overdue' || a.blockerCount > 0;
    }
    if (savedView === 'ready_prod') {
      return a.productionReadiness === 'Approved' || a.productionReadiness === 'Ready';
    }
    if (savedView === 'incomplete') {
      return a.dataCompletenessPercent < 70;
    }

    return true;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900">
            Article Pipeline ({filteredArticles.length})
          </h1>
          <p className="text-xs text-slate-500">
            Pusat pemantauan seluruh prospek dan produksi artikel fashion
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-[#087E79] shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-[#087E79] shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-[#087E79] shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {canCreate && onOpenQuickCreate && (
            <button
              onClick={onOpenQuickCreate}
              className="paten-primary-action flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Artikel</span>
            </button>
          )}
        </div>
      </div>

      {/* Saved Views & Search Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-bold shrink-0 text-[11px]">Saved Views:</span>
          <button
            onClick={() => setSavedView('all')}
            className={`px-3 py-1 rounded-full font-bold transition-colors shrink-0 ${
              savedView === 'all'
                ? 'bg-[#087E79] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Semua Artikel
          </button>
          <button
            onClick={() => setSavedView('at_risk')}
            className={`px-3 py-1 rounded-full font-bold transition-colors shrink-0 ${
              savedView === 'at_risk'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            At Risk / Blocker
          </button>
          <button
            onClick={() => setSavedView('ready_prod')}
            className={`px-3 py-1 rounded-full font-bold transition-colors shrink-0 ${
              savedView === 'ready_prod'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Siap Produksi
          </button>
          <button
            onClick={() => setSavedView('incomplete')}
            className={`px-3 py-1 rounded-full font-bold transition-colors shrink-0 ${
              savedView === 'incomplete'
                ? 'bg-rose-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Data Belum Lengkap (&lt;70%)
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari artikel berdasarkan nama, kode GG, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:border-[#087E79] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="All">Semua Tahap Stage</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={selectedHealthFilter}
              onChange={(e) => setSelectedHealthFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="All">Semua Schedule Health</option>
              <option value="On Track">On Track</option>
              <option value="At Risk">At Risk</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden hover:border-[#087E79] hover:shadow-2xs transition-all flex flex-col justify-between"
            >
              <div className="p-3.5 space-y-2.5">
                {/* Header Row & Image */}
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={art.mainImage} alt={art.name} className="w-full h-full object-cover" />
                    {art.blockerCount > 0 && (
                      <div className="absolute top-0.5 right-0.5 bg-rose-600 text-white text-[8px] font-bold px-1 rounded flex items-center">
                        !
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-mono font-bold text-[#087E79] truncate">
                        {art.code}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${stageBadgeClass(art.stage)}`}>
                        {art.stage}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900 line-clamp-1 mt-0.5">
                      {art.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate">
                      {art.category} · {art.seasonCollection}
                    </p>

                    {/* Swatches Row */}
                    <div className="flex items-center gap-1 mt-1.5">
                      {(art.colorways || []).map((c) => (
                        <span
                          key={c.id}
                          className="w-3 h-3 rounded-full border border-slate-300 shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Metrics Progress Bars */}
                <div className="space-y-1 text-[10px] pt-1 border-t border-slate-100">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Workflow Progress</span>
                    <span className="font-extrabold text-slate-900">
                      {art.workflowProgressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#087E79] h-full rounded-full"
                      style={{ width: `${art.workflowProgressPercent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-slate-500 font-medium pt-0.5">
                    <span>Data Completeness</span>
                    <span className="font-extrabold text-slate-900">
                      {art.dataCompletenessPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${art.dataCompletenessPercent}%` }}
                    />
                  </div>
                </div>

                {/* Details Footer Info */}
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>Target Rilis: {art.targetReleaseDate}</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {formatIDR(art.calculatedHPP)}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Brief, Detail, Workspace, Hapus */}
              <div className="px-2.5 py-1.5 bg-slate-50 border-t border-slate-200 flex items-center gap-1 text-center text-[11px] font-bold">
                <button
                  onClick={() => onOpenArticle(art.id, 'brief')}
                  className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#087E79] hover:border-[#087E79] transition-colors"
                >
                  Brief
                </button>
                <button
                  onClick={() => onOpenArticle(art.id, 'detail')}
                  className="flex-1 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-[#087E79] hover:border-[#087E79] transition-colors"
                >
                  Detail
                </button>
                <button
                  onClick={() => onOpenArticle(art.id, 'workspace')}
                  className="flex-1 py-1 rounded-lg bg-[#087E79] text-white hover:bg-[#066864] transition-colors font-bold shadow-2xs"
                >
                  Workspace
                </button>
                {onEditArticle && (
                  <button
                    onClick={() => onEditArticle(art.id)}
                    title="Edit data dasar artikel"
                    aria-label={`Edit artikel ${art.code}`}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-colors shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDeleteArticle && (
                  <ConfirmDeleteButton
                    onConfirm={() => onDeleteArticle(art.id)}
                    label={`Hapus artikel ${art.code}`}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors shrink-0"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List Mode */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Artikel & Kode</th>
                  <th className="py-3 px-3">Stage / Status</th>
                  <th className="py-3 px-3">Progress</th>
                  <th className="py-3 px-3">Completeness</th>
                  <th className="py-3 px-3">Target Rilis</th>
                  <th className="py-3 px-3">HPP Est.</th>
                  <th className="py-3 px-4 text-center">Aksi Langsung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((art) => (
                  <tr key={art.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={art.mainImage}
                          alt={art.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-mono font-bold text-[#087E79]">
                            {art.code}
                          </span>
                          <h4 className="font-bold text-slate-900">{art.name}</h4>
                          <span className="text-[10px] text-slate-400">{art.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${stageBadgeClass(art.stage)}`}>
                        {art.stage}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {art.workflowProgressPercent}%
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {art.dataCompletenessPercent}%
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-medium">{art.targetReleaseDate}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {formatIDR(art.calculatedHPP)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1 font-bold text-[11px]">
                        <button
                          onClick={() => onOpenArticle(art.id, 'brief')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-[#087E79]"
                        >
                          Brief
                        </button>
                        <button
                          onClick={() => onOpenArticle(art.id, 'detail')}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-[#087E79]"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => onOpenArticle(art.id, 'workspace')}
                          className="px-2.5 py-1 rounded-lg bg-[#087E79] text-white hover:bg-[#066864]"
                        >
                          Workspace
                        </button>
                        {onEditArticle && (
                          <button
                            onClick={() => onEditArticle(art.id)}
                            title="Edit data dasar artikel"
                            aria-label={`Edit artikel ${art.code}`}
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-300 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteArticle && (
                          <ConfirmDeleteButton
                            onConfirm={() => onDeleteArticle(art.id)}
                            label={`Hapus artikel ${art.code}`}
                            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-colors"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban Mode */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6">
          {STAGES.map((stage) => {
            const stageArticles = filteredArticles.filter((a) => a.stage === stage);

            return (
              <div
                key={stage}
                className="w-72 shrink-0 bg-slate-100 rounded-2xl p-3 border border-slate-200 flex flex-col max-h-[75vh]"
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${stageDotClass(stage)}`} />
                    <h3 className="font-extrabold text-xs text-slate-900">{stage}</h3>
                  </div>
                  <span className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-2xs ${stageBadgeClass(stage)}`}>
                    {stageArticles.length}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
                  {stageArticles.map((art) => (
                    <div
                      key={art.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-[#087E79] transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={art.mainImage}
                          alt={art.name}
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-mono font-bold text-[#087E79]">{art.code}</span>
                          <h4 className="font-bold text-xs text-slate-900 truncate">
                            {art.name}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Prog: {art.workflowProgressPercent}%</span>
                        <span className="font-bold text-slate-900">{formatIDR(art.calculatedHPP)}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[10px] font-bold text-center">
                        <button
                          onClick={() => onOpenArticle(art.id, 'brief')}
                          className="py-1 rounded-lg bg-slate-100 text-slate-700 hover:text-[#087E79]"
                        >
                          Brief
                        </button>
                        <button
                          onClick={() => onOpenArticle(art.id, 'detail')}
                          className="py-1 rounded-lg bg-slate-100 text-slate-700 hover:text-[#087E79]"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => onOpenArticle(art.id, 'workspace')}
                          className="py-1 rounded-lg bg-[#087E79] text-white font-extrabold"
                        >
                          Work
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
