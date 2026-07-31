/**
 * Product Launch OS 3.0 - Sticky Article Header & Mode Tabs
 */

import React from 'react';
import {
  ArrowLeft,
  FileText,
  Eye,
  Layers,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Article } from '../../types';

interface ArticleStickyHeaderProps {
  article: Article;
  activeTab: 'brief' | 'detail' | 'workspace';
  onSelectTab: (tab: 'brief' | 'detail' | 'workspace') => void;
  onBack: () => void;
  onRequestApproval: () => void;
}

export const ArticleStickyHeader: React.FC<ArticleStickyHeaderProps> = ({
  article,
  activeTab,
  onSelectTab,
  onBack,
  onRequestApproval,
}) => {
  return (
    <div className="paten-sticky-header sticky z-20 bg-white border-b border-slate-200 shadow-2xs">
      <div className="px-3.5 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Left: Back button + Title & Status Badges */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
            title="Kembali ke Pipeline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <img
            src={article.mainImage}
            alt={article.name}
            className="w-8 h-8 rounded-lg object-cover border border-slate-200"
          />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-[11px] text-[#087E79]">
                {article.code}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#DDF4F1] text-[#087E79] border border-[#087E79]/20">
                {article.stage}
              </span>
              {article.scheduleHealth === 'At Risk' && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-700 flex items-center gap-1 border border-amber-200">
                  <AlertTriangle className="w-2.5 h-2.5" />
                  <span>At Risk</span>
                </span>
              )}
            </div>

            <h1 className="font-extrabold text-xs text-slate-900 leading-tight">
              {article.name}
            </h1>
          </div>
        </div>

        {/* Center: The 3 Mode Segmented Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200 self-center sm:self-auto">
          <button
            onClick={() => onSelectTab('brief')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              activeTab === 'brief'
                ? 'bg-white text-[#087E79] shadow-2xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Brief</span>
          </button>

          <button
            onClick={() => onSelectTab('detail')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              activeTab === 'detail'
                ? 'bg-white text-[#087E79] shadow-2xs font-extrabold border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Detail Hasil</span>
          </button>

          <button
            onClick={() => onSelectTab('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              activeTab === 'workspace'
                ? 'bg-[#087E79] text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onRequestApproval}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDF4F1] border border-[#087E79]/20 text-[#087E79] text-xs font-bold hover:bg-[#087E79] hover:text-white transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Minta Review / Approval</span>
          </button>
        </div>
      </div>
    </div>
  );
};
