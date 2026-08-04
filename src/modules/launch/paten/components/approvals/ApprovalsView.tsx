/**
 * Product Launch OS 3.0 - Approvals Gate Center
 */

import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { ApprovalGate, Article } from '../../types';

interface ApprovalsViewProps {
  articles: Article[];
  approvals: ApprovalGate[];
  onUpdateApproval: (updated: ApprovalGate) => void;
  onCreateApproval: (approval: ApprovalGate) => void;
  currentUserName: string;
  canDecide: boolean;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  articles,
  approvals,
  onUpdateApproval,
  onCreateApproval,
  currentUserName,
  canDecide,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'decided'>('pending');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalGate | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestArticleId, setRequestArticleId] = useState(articles[0]?.id || '');
  const [requestGateType, setRequestGateType] = useState<ApprovalGate['gateType']>('Brief Approval');
  const [requestNote, setRequestNote] = useState('');

  const pendingList = approvals.filter((a) => a.status === 'Pending');
  const decidedList = approvals.filter((a) => a.status !== 'Pending');

  const handleDecision = (status: 'Approved' | 'Revision Requested' | 'Rejected') => {
    if (!selectedApproval) return;

    const updated: ApprovalGate = {
      ...selectedApproval,
      status,
      decidedBy: currentUserName,
      decidedDate: new Date().toISOString().split('T')[0],
      decisionNote: decisionNote || `Status gate disetujui/diubah menjadi ${status}`,
    };

    onUpdateApproval(updated);
    setSelectedApproval(null);
    setDecisionNote('');
  };

  const handleCreateRequest = () => {
    const article = articles.find((item) => item.id === requestArticleId);
    if (!article || !requestNote.trim()) return;
    onCreateApproval({
      id: crypto.randomUUID(),
      articleId: article.id,
      articleCode: article.code,
      articleTitle: article.name,
      gateType: requestGateType,
      requestedBy: currentUserName,
      requestedDate: new Date().toISOString().slice(0, 10),
      approverRole: 'Owner / Approver',
      status: 'Pending',
      versionTag: `${requestGateType} · ${new Date().toISOString().slice(0, 10)}`,
      summaryNote: requestNote.trim(),
    });
    setRequestNote('');
    setShowRequestModal(false);
    setActiveTab('pending');
  };

  return (
    <div className="space-y-5 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-[#087E79]" />
            <h1 className="text-lg font-extrabold text-slate-900">
              Pusat Persetujuan (Approvals Gate)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Pintu persetujuan resmi untuk HPP, Sampel, Spesifikasi & Pelepasan Produksi Massal.
          </p>
        </div>
        {canDecide && (
          <button type="button" onClick={() => setShowRequestModal(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            Request Approval
          </button>
        )}
      </div>

      {/* Penjelasan tujuan — banyak yang bingung membedakan gate persetujuan
          dari tugas biasa. */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-3.5 flex gap-3">
        <span className="p-2 rounded-xl bg-white text-[#087E79] shrink-0 h-fit">
          <Info className="w-4 h-4" />
        </span>
        <div className="text-[11px] text-teal-950/80 leading-relaxed">
          <p className="font-extrabold text-teal-900 text-xs mb-0.5">Untuk apa halaman ini?</p>
          <p>
            <strong>Approval Gate</strong> adalah titik “ya/tidak” resmi sebelum artikel boleh
            lanjut ke tahap berikutnya — misalnya Brief dikunci, HPP disetujui, atau produksi
            massal dilepas. Berbeda dari <strong>Tugas</strong> (pekerjaan harian) dan
            <strong> Blocker</strong> (masalah yang menghambat): gate memberi jejak keputusan
            <em> siapa menyetujui apa dan kapan</em>, sehingga tidak ada tahap besar yang jalan
            tanpa persetujuan penanggung jawab.
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-teal-900/70">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Minta approval saat sebuah tahap siap dinilai</span>
            <span className="inline-flex items-center gap-1"><FileCheck2 className="w-3 h-3" /> Approver memilih Setujui / Revisi / Tolak beserta catatan</span>
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'pending'
              ? 'bg-[#087E79] text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Menunggu Persetujuan ({pendingList.length})
        </button>

        <button
          onClick={() => setActiveTab('decided')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'decided'
              ? 'bg-[#087E79] text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Histori Keputusan ({decidedList.length})
        </button>
      </div>

      {/* Pending Approvals Grid */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {pendingList.length > 0 ? (
            pendingList.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs hover:border-[#087E79] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[#087E79]">
                        {app.articleCode}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        {app.gateType}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-1">
                      {app.articleTitle}
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Diminta oleh: <strong className="text-slate-800">{app.requestedBy}</strong>
                  </span>
                </div>

                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                  {app.summaryNote}
                </p>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => setSelectedApproval(app)}
                    disabled={!canDecide}
                    className="px-4 py-1.5 rounded-xl bg-[#087E79] text-white text-xs font-bold hover:bg-[#066864] transition-all shadow-2xs"
                  >
                    Proses Persetujuan
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-semibold">
              Tidak ada persetujuan yang menunggu tindakan Anda.
            </div>
          )}
        </div>
      )}

      {/* Decided Approvals Grid */}
      {activeTab === 'decided' && (
        <div className="space-y-3">
          {decidedList.length > 0 ? (
            decidedList.map((app) => (
              <div
                key={app.id}
                className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#087E79]">
                      {app.articleCode}
                    </span>
                    <span className="font-bold text-xs text-slate-900">{app.gateType}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      app.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.status === 'Revision Requested'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 font-medium">{app.decisionNote}</p>
                <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex items-center justify-between">
                  <span>Diputuskan oleh: {app.decidedBy || 'Pimpro'}</span>
                  <span>Tanggal: {app.decidedDate || 'Hari ini'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs font-semibold">
              Belum ada histori keputusan.
            </div>
          )}
        </div>
      )}

      {/* Decision Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="approval-decision-title">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <h3 id="approval-decision-title" className="font-extrabold text-sm text-slate-900">
              Proses Gate: {selectedApproval.gateType}
            </h3>
            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              {selectedApproval.summaryNote}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Catatan Keputusan / Instruksi Tim
              </label>
              <textarea
                rows={3}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                placeholder="Berikan instruksi khusus atau alasan penyetujuan/revisi..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-[#087E79]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedApproval(null)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => handleDecision('Revision Requested')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
              >
                Minta Revisi
              </button>
              <button
                onClick={() => handleDecision('Rejected')}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Tolak
              </button>
              <button
                onClick={() => handleDecision('Approved')}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-2xs"
              >
                Setujui (Approve)
              </button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="approval-request-title">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-white/70 bg-white p-5 shadow-2xl">
            <div>
              <h3 id="approval-request-title" className="text-base font-extrabold text-slate-950">Buat request approval</h3>
              <p className="mt-1 text-xs text-slate-500">Keputusan akan disimpan bersama artikel dan versi gate.</p>
            </div>
            <label className="block text-xs font-bold text-slate-700">
              Artikel
              <select value={requestArticleId} onChange={(event) => setRequestArticleId(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                {articles.map((article) => <option key={article.id} value={article.id}>{article.code} — {article.name}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Gate
              <select value={requestGateType} onChange={(event) => setRequestGateType(event.target.value as ApprovalGate['gateType'])} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                {['Brief Approval', 'Specification Approval', 'Sample Approval', 'HPP Approval', 'Production Release', 'Launch Approval'].map((gate) => <option key={gate}>{gate}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Ringkasan yang perlu diputuskan
              <textarea value={requestNote} onChange={(event) => setRequestNote(event.target.value)} rows={4} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5" placeholder="Jelaskan versi, perubahan, risiko, dan keputusan yang dibutuhkan." />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowRequestModal(false)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Batal</button>
              <button type="button" onClick={handleCreateRequest} disabled={!requestArticleId || !requestNote.trim()} className="rounded-full bg-slate-950 px-5 py-2 text-xs font-bold text-white disabled:opacity-40">Kirim Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
