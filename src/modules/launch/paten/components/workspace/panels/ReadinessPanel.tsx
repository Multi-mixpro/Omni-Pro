/**
 * Product Launch OS 3.0 - Workspace Panel: QC & Production Readiness Gate
 */

import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Sparkles } from 'lucide-react';
import { Article, ReadinessCheckItem } from '../../../types';

interface ReadinessPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

/**
 * Checklist kelayakan produksi standar untuk artikel garmen.
 *
 * Dipakai sebagai titik awal karena sebelumnya panel ini bisa kosong tanpa cara
 * mengisi — gate jadi tidak bisa dipakai. Ini gerbang mutu terakhir sebelum PO
 * produksi massal dilepas, jadi item kritis di sini menahan rilis bila belum
 * tuntas.
 */
const STANDARD_READINESS: Omit<ReadinessCheckItem, 'id' | 'isCompleted'>[] = [
  { requirement: 'Brief & spesifikasi final disetujui', stage: 'Specification', isCritical: true, ownerRole: 'Pimpro' },
  { requirement: 'BOM & material utama terkunci', stage: 'Specification', isCritical: true, ownerRole: 'Sourcing' },
  { requirement: 'Supplier & MOQ terkonfirmasi', stage: 'Source & Pattern', isCritical: true, ownerRole: 'Sourcing' },
  { requirement: 'Size chart & toleransi final', stage: 'Source & Pattern', isCritical: true, ownerRole: 'Pattern Maker' },
  { requirement: 'Golden sample disetujui', stage: 'Sampling', isCritical: true, ownerRole: 'QC' },
  { requirement: 'HPP terkunci & margin disetujui', stage: 'Costing', isCritical: true, ownerRole: 'Finance' },
  { requirement: 'Matriks stok & rencana PO siap', stage: 'Production Plan', isCritical: false, ownerRole: 'Pimpro' },
  { requirement: 'Approval Production Release diterbitkan', stage: 'Production Plan', isCritical: true, ownerRole: 'Owner' },
];

export const ReadinessPanel: React.FC<ReadinessPanelProps> = ({
  article,
  onUpdateArticle,
}) => {
  const items = article.readinessChecklist || [];
  const [newRequirement, setNewRequirement] = useState('');
  const [newOwner, setNewOwner] = useState('Pimpro');

  /**
   * Turunkan status kelayakan dari proporsi item yang selesai — dan item KRITIS
   * yang belum selesai selalu menahan gate, seberapa pun persentasenya.
   */
  const deriveReadiness = (list: ReadinessCheckItem[]): Article['productionReadiness'] => {
    if (list.length === 0) return 'Not Ready';
    const done = list.filter((i) => i.isCompleted).length;
    const criticalPending = list.some((i) => i.isCritical && !i.isCompleted);
    if (done === list.length) return 'Approved';
    if (!criticalPending && done / list.length >= 0.5) return 'Conditional';
    return 'Not Ready';
  };

  const persist = (list: ReadinessCheckItem[]) => {
    onUpdateArticle({
      ...article,
      readinessChecklist: list,
      productionReadiness: deriveReadiness(list),
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleToggleCheck = (checkId: string) => {
    persist(items.map((item) => (item.id === checkId ? { ...item, isCompleted: !item.isCompleted } : item)));
  };

  const handleApplyTemplate = () => {
    persist(
      STANDARD_READINESS.map((item, idx) => ({
        ...item,
        id: `rc-${Date.now()}-${idx}`,
        isCompleted: false,
      })),
    );
  };

  const handleAddItem = () => {
    const req = newRequirement.trim();
    if (!req) return;
    persist([
      ...items,
      {
        id: `rc-${Date.now()}`,
        requirement: req,
        stage: article.stage,
        isCritical: false,
        isCompleted: false,
        ownerRole: newOwner,
      },
    ]);
    setNewRequirement('');
  };

  const handleRemoveItem = (checkId: string) => {
    persist(items.filter((item) => item.id !== checkId));
  };

  const completedCount = items.filter((i) => i.isCompleted).length;
  const criticalPending = items.filter((i) => i.isCritical && !i.isCompleted).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const statusTone =
    article.productionReadiness === 'Approved'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : article.productionReadiness === 'Conditional'
      ? 'bg-amber-50 border-amber-200 text-amber-800'
      : 'bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div className="space-y-4 text-xs text-slate-900">
      {/* Status ringkas + progress */}
      <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${statusTone}`}>
        <div className="min-w-0">
          <span className="font-bold text-xs">
            Status Kelayakan Produksi: {article.productionReadiness}
          </span>
          <p className="text-[11px] opacity-80 mt-0.5">
            {items.length === 0
              ? 'Belum ada checklist. Terapkan checklist standar untuk mulai menilai kelayakan.'
              : criticalPending > 0
              ? `${criticalPending} item kritis belum tuntas — menahan pelepasan produksi massal.`
              : 'Seluruh item kritis tuntas. Gate siap dilepas bila semua item selesai.'}
          </p>
          {items.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 w-40 max-w-[50vw] rounded-full bg-white/70 overflow-hidden">
                <div
                  className={`h-full rounded-full ${progress === 100 ? 'bg-emerald-500' : criticalPending > 0 ? 'bg-slate-400' : 'bg-amber-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono font-bold">{completedCount}/{items.length} · {progress}%</span>
            </div>
          )}
        </div>
        <ShieldCheck className="w-5 h-5 shrink-0" />
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center space-y-3">
          <p className="text-xs text-slate-500">Belum ada item gate kelayakan untuk artikel ini.</p>
          <button
            type="button"
            onClick={handleApplyTemplate}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#087E79] px-4 py-2 text-xs font-bold text-white hover:bg-[#066864] shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Terapkan checklist standar (8 item)
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2 shadow-2xs">
          {items.map((check) => (
            <div
              key={check.id}
              className={`group p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                check.isCompleted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={check.isCompleted}
                  onChange={() => handleToggleCheck(check.id)}
                  className="rounded text-[#087E79] focus:ring-[#087E79] shrink-0"
                />
                <span className="font-bold truncate">{check.requirement}</span>
                {check.isCritical && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                    Kritis
                  </span>
                )}
              </label>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                  {check.ownerRole}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(check.id)}
                  className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                  title="Hapus item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Tambah item custom */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); } }}
              placeholder="Tambah syarat kelayakan lain…"
              className="flex-1 p-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-[#087E79]"
            />
            <select
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
            >
              {['Pimpro', 'Sourcing', 'Pattern Maker', 'QC', 'Finance', 'Owner', 'Marketing'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!newRequirement.trim()}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-[#087E79] px-3 py-2 text-xs font-bold text-white hover:bg-[#066864] disabled:opacity-40 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
