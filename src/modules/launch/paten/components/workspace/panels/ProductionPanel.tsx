/**
 * Product Launch OS 3.0 - Workspace Panel: Production Batch Tracking
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Article, ProductionBatch } from '../../../types';
import { ConfirmDeleteButton } from '../../shared/ConfirmDeleteButton';

interface ProductionPanelProps {
  article: Article;
  onUpdateArticle: (updated: Article) => void;
}

const OPERATIONS: ProductionBatch['currentOperation'][] = [
  'Cutting',
  'Sewing',
  'Finishing',
  'QC Inspection',
  'Packing',
  'Stock Ready',
];

function operationForProgress(progress: number): ProductionBatch['currentOperation'] {
  if (progress >= 100) return 'Stock Ready';
  if (progress >= 80) return 'Packing';
  if (progress >= 60) return 'QC Inspection';
  if (progress >= 40) return 'Finishing';
  if (progress >= 20) return 'Sewing';
  return 'Cutting';
}

export const ProductionPanel: React.FC<ProductionPanelProps> = ({
  article,
  onUpdateArticle,
}) => {
  const batches = article.batches || [];
  const [showCreate, setShowCreate] = useState(false);
  const [batchCode, setBatchCode] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [targetFinishDate, setTargetFinishDate] = useState(article.targetReleaseDate || '');

  const saveBatches = (next: ProductionBatch[]) => {
    onUpdateArticle({
      ...article,
      batches: next,
      stage: next.some((batch) => batch.progressPercent > 0) ? 'Production' : article.stage,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleCreate = () => {
    if (!batchCode.trim() || !vendorName.trim() || quantity <= 0) return;
    saveBatches([
      ...batches,
      {
        id: crypto.randomUUID(),
        batchCode: batchCode.trim(),
        vendorName: vendorName.trim(),
        startDate: new Date().toISOString().slice(0, 10),
        targetFinishDate,
        totalTargetQty: quantity,
        currentOperation: 'Cutting',
        passedQty: 0,
        rejectedQty: 0,
        reworkQty: 0,
        progressPercent: 0,
      },
    ]);
    setBatchCode('');
    setVendorName('');
    setQuantity(0);
    setShowCreate(false);
  };

  const patchBatch = (id: string, patch: Partial<ProductionBatch>) => {
    saveBatches(batches.map((batch) => batch.id === id ? { ...batch, ...patch } : batch));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-xs text-slate-900">Pemantauan Batch Produksi Massal</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Kelola PO, vendor, operasi, progres dan hasil QC dalam satu lembar kerja.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((value) => !value)}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-[11px] font-bold text-white hover:bg-slate-800"
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Batch
        </button>
      </div>

      {showCreate && (
        <div className="grid gap-2 rounded-2xl border border-teal-200 bg-teal-50/60 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <input value={batchCode} onChange={(event) => setBatchCode(event.target.value)} placeholder="Kode PO / Batch" className="rounded-xl border border-white bg-white px-3 py-2 text-xs" />
          <input value={vendorName} onChange={(event) => setVendorName(event.target.value)} placeholder="Vendor produksi" className="rounded-xl border border-white bg-white px-3 py-2 text-xs" />
          <input type="number" min="1" value={quantity || ''} onChange={(event) => setQuantity(Number(event.target.value))} placeholder="Target pcs" className="rounded-xl border border-white bg-white px-3 py-2 text-xs" />
          <input type="date" value={targetFinishDate} onChange={(event) => setTargetFinishDate(event.target.value)} className="rounded-xl border border-white bg-white px-3 py-2 text-xs" />
          <button type="button" onClick={handleCreate} disabled={!batchCode.trim() || !vendorName.trim() || quantity <= 0} className="rounded-xl bg-[#087E79] px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
            Simpan Batch
          </button>
        </div>
      )}

      {batches.length > 0 ? (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div key={batch.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-mono text-[11px] font-bold text-[#087E79]">{batch.batchCode}</span>
                  <h4 className="font-bold text-slate-900">{batch.vendorName} · {batch.totalTargetQty} pcs</h4>
                  <p className="mt-0.5 text-[10px] text-slate-400">Target selesai {batch.targetFinishDate || 'belum ditetapkan'}</p>
                </div>
                <ConfirmDeleteButton
                  onConfirm={() => saveBatches(batches.filter((item) => item.id !== batch.id))}
                  label={`Hapus ${batch.batchCode}`}
                  className="rounded-full p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Progress batch</span>
                    <span className="font-mono text-slate-900">{batch.progressPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={batch.progressPercent}
                    onChange={(event) => {
                      const progress = Number(event.target.value);
                      patchBatch(batch.id, { progressPercent: progress, currentOperation: operationForProgress(progress) });
                    }}
                    className="w-full accent-[#087E79]"
                  />
                </div>
                <select value={batch.currentOperation} onChange={(event) => patchBatch(batch.id, { currentOperation: event.target.value as ProductionBatch['currentOperation'] })} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold">
                  {OPERATIONS.map((operation) => <option key={operation}>{operation}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <label className="rounded-xl bg-emerald-50 p-2 font-bold text-emerald-700">Passed
                  <input type="number" min="0" value={batch.passedQty} onChange={(event) => patchBatch(batch.id, { passedQty: Math.max(0, Number(event.target.value)) })} className="mt-1 w-full rounded-lg border border-emerald-100 bg-white px-2 py-1 font-mono text-slate-900" />
                </label>
                <label className="rounded-xl bg-rose-50 p-2 font-bold text-rose-700">Rejected
                  <input type="number" min="0" value={batch.rejectedQty} onChange={(event) => patchBatch(batch.id, { rejectedQty: Math.max(0, Number(event.target.value)) })} className="mt-1 w-full rounded-lg border border-rose-100 bg-white px-2 py-1 font-mono text-slate-900" />
                </label>
                <label className="rounded-xl bg-amber-50 p-2 font-bold text-amber-700">Rework
                  <input type="number" min="0" value={batch.reworkQty} onChange={(event) => patchBatch(batch.id, { reworkQty: Math.max(0, Number(event.target.value)) })} className="mt-1 w-full rounded-lg border border-amber-100 bg-white px-2 py-1 font-mono text-slate-900" />
                </label>
              </div>

              {/* Rekonsiliasi hasil QC vs target — angka yang tak masuk akal
                  (total QC melebihi target) ditandai agar tidak lolos ke laporan. */}
              {(() => {
                const inspected = batch.passedQty + batch.rejectedQty + batch.reworkQty;
                const over = inspected > batch.totalTargetQty;
                const remaining = batch.totalTargetQty - inspected;
                return (
                  <div className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[10px] font-bold ${
                    over ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}>
                    <span>Diperiksa: <span className="font-mono">{inspected}</span> / {batch.totalTargetQty} pcs</span>
                    {over ? (
                      <span className="inline-flex items-center gap-1 text-rose-700">
                        ⚠ Melebihi target {inspected - batch.totalTargetQty} pcs — periksa input QC
                      </span>
                    ) : (
                      <span className="text-slate-500">Sisa belum diperiksa: <span className="font-mono">{remaining}</span> pcs</span>
                    )}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-xs text-slate-500">
          Belum ada batch produksi. Tambahkan PO pertama ketika readiness dan approval sudah selesai.
        </div>
      )}
    </div>
  );
};
