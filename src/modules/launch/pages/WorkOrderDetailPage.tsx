import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workOrderRepository } from '../data/workOrderRepository';
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Layers } from 'lucide-react';

export const WorkOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'hpp' | 'qc'>('overview');

  const { data: wo, isLoading: woLoading } = useQuery({
    queryKey: ['work-order-detail', id],
    queryFn: () => workOrderRepository.getWorkOrderById(id || ''),
    enabled: Boolean(id),
  });

  const { data: stageRuns = [] } = useQuery({
    queryKey: ['stage-runs', id],
    queryFn: () => workOrderRepository.getStageRuns(id || ''),
    enabled: Boolean(id),
  });

  if (woLoading) {
    return <div className="p-8 text-center text-slate-400 text-xs">Memuat detail Perintah Kerja...</div>;
  }

  if (!wo) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        Perintah Kerja tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Nav */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/app/launch/work-orders')}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {wo.launch_brands?.name}
            </span>
            <span className="text-xs font-mono text-slate-400">{wo.article_code}</span>
          </div>
          <h1 className="text-xl font-bold text-white mt-1">{wo.article_name}</h1>
        </div>
      </div>

      {/* Progress Card */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Progress 8-Stage Launching</span>
          <span className="font-bold text-blue-400">{wo.progress_percent}% Selesai</span>
        </div>
        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full transition-all duration-500"
            style={{ width: `${wo.progress_percent}%` }}
          />
        </div>
      </div>

      {/* 8-Stage Workflow Horizontal Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
        <div className="flex items-center space-x-3 min-w-[700px]">
          {stageRuns.map((sr, idx) => {
            const isCompleted = sr.status === 'COMPLETED';
            const isInProgress = sr.status === 'IN_PROGRESS';
            const isBlocked = sr.status === 'BLOCKED';

            return (
              <div
                key={sr.id}
                className={`flex-1 p-3 rounded-xl border text-center transition ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isInProgress
                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-lg shadow-blue-500/10'
                    : isBlocked
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isInProgress ? (
                    <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                  ) : isBlocked ? (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-600">{idx + 1}</span>
                  )}
                </div>
                <p className="text-[11px] font-semibold truncate">{sr.stage_code}</p>
                <p className="text-[9px] uppercase tracking-wider mt-0.5 opacity-80">{sr.status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex space-x-2 border-b border-slate-800">
        {(['overview', 'workflow', 'hpp', 'qc'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            <h3 className="font-bold text-slate-200 text-sm">Informasi Ringkasan Brief Artikel</h3>
            <p className="text-slate-400">{wo.description || 'Tidak ada deskripsi tambahan.'}</p>
            <div className="grid grid-cols-2 gap-4 border-t border-slate-900 pt-4">
              <div>
                <span className="text-slate-500">Kategori:</span>
                <p className="font-semibold text-slate-300">{wo.category}</p>
              </div>
              <div>
                <span className="text-slate-500">Prioritas:</span>
                <p className="font-semibold text-slate-300">{wo.priority}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>Modul {activeTab.toUpperCase()} siap dihubungkan dengan Service Layer.</p>
          </div>
        )}
      </div>
    </div>
  );
};
