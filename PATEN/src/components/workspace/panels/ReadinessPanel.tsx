/**
 * Product Launch OS 3.0 - Workspace Panel: QC & Production Readiness Gate
 */

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Article, ReadinessCheckItem } from '../../../types';

interface ReadinessPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

export const ReadinessPanel: React.FC<ReadinessPanelProps> = ({
  article,
  onUpdateArticle,
}) => {
  const items = article.readinessChecklist || [];

  const handleToggleCheck = (checkId: string) => {
    const updated = items.map((item) =>
      item.id === checkId ? { ...item, isCompleted: !item.isCompleted } : item
    );

    const completedCount = updated.filter((i) => i.isCompleted).length;
    const isAllCompleted = completedCount === updated.length;

    onUpdateArticle({
      ...article,
      readinessChecklist: updated,
      productionReadiness: isAllCompleted ? 'Approved' : completedCount > 4 ? 'Conditional' : 'Not Ready',
      lastUpdated: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
        <div>
          <span className="font-bold text-xs text-slate-900">
            Status Kelayakan Produksi: {article.productionReadiness}
          </span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Seluruh item kritis wajib dicentang sebelum pelepasan rilis produksi massal.
          </p>
        </div>
        <ShieldCheck className="w-5 h-5 text-emerald-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 text-xs shadow-2xs">
        {items.map((check) => (
          <div
            key={check.id}
            onClick={() => handleToggleCheck(check.id)}
            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
              check.isCompleted
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={check.isCompleted}
                onChange={() => {}}
                className="rounded text-[#087E79] focus:ring-[#087E79]"
              />
              <span className="font-bold">{check.requirement}</span>
            </div>

            <span className="text-[10px] font-semibold text-slate-400">
              {check.ownerRole}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
