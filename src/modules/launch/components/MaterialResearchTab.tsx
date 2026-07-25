import React, { useState } from 'react';
import { MaterialCandidate } from '../domain/stageTypes';
import { Layers, Plus, CheckCircle2, XCircle, Tag } from 'lucide-react';

interface MaterialResearchTabProps {
  workOrderId: string;
}

export const MaterialResearchTab: React.FC<MaterialResearchTabProps> = () => {
  const [candidates, setCandidates] = useState<MaterialCandidate[]>([
    {
      id: '1',
      work_order_id: '',
      material_name: 'Cotton Combed 30s Reaktif',
      composition: '100% Cotton',
      gsm: 150,
      width_cm: 185,
      unit: 'meter',
      estimated_consumption: 1.2,
      characteristics: 'Halus, menyerap keringat dengan sangat baik, jatuh saat dipakai',
      suitability_reason: 'Sangat cocok untuk produk T-Shirt harian GG Supply',
      status: 'SELECTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: '2',
      work_order_id: '',
      material_name: 'Cotton Bamboo 30s Premium',
      composition: '70% Bamboo 30% Cotton',
      gsm: 160,
      width_cm: 180,
      unit: 'meter',
      estimated_consumption: 1.2,
      characteristics: 'Anti-bakteri alami, sangat lembut',
      suitability_reason: 'Opsi alternatif kain kelas premium',
      status: 'CANDIDATE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newComposition, setNewComposition] = useState('');
  const [newGsm, setNewGsm] = useState<number>(150);

  const handleAddCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName) return;

    setCandidates([
      ...candidates,
      {
        id: String(Date.now()),
        work_order_id: '',
        material_name: newMaterialName,
        composition: newComposition,
        gsm: newGsm,
        unit: 'meter',
        estimated_consumption: 1.2,
        status: 'CANDIDATE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    setNewMaterialName('');
    setNewComposition('');
    setShowAddModal(false);
  };

  const handleSetStatus = (id: string, status: 'SELECTED' | 'REJECTED') => {
    setCandidates(
      candidates.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Tahap 2: Riset & Seleksi Bahan / Kain</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identifikasi spesifikasi kain, komposisi, gramasi (GSM), dan konsumsi per pcs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-blue-500/20 flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kandidat Bahan</span>
        </button>
      </div>

      {/* Candidate Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {candidates.map((item) => {
          const isSelected = item.status === 'SELECTED';
          const isRejected = item.status === 'REJECTED';

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition space-y-4 ${
                isSelected
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : isRejected
                  ? 'bg-slate-900/40 border-slate-800 opacity-60'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isRejected
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {item.status}
                  </span>
                  <h4 className="font-bold text-sm text-white mt-2">{item.material_name}</h4>
                  <p className="text-xs text-slate-400">{item.composition}</p>
                </div>
                <Tag className="w-4 h-4 text-slate-500" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-slate-500">GSM:</span>
                  <p className="font-semibold text-slate-200">{item.gsm || '-'} g/m²</p>
                </div>
                <div>
                  <span className="text-slate-500">Lebar Fabric:</span>
                  <p className="font-semibold text-slate-200">{item.width_cm || '-'} cm</p>
                </div>
              </div>

              {item.characteristics && (
                <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                  "{item.characteristics}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-800/60">
                {!isSelected && (
                  <button
                    onClick={() => handleSetStatus(item.id, 'SELECTED')}
                    className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pilih Bahan Ini</span>
                  </button>
                )}
                {!isRejected && (
                  <button
                    onClick={() => handleSetStatus(item.id, 'REJECTED')}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Tambah Kandidat Bahan Baru</h3>
            <form onSubmit={handleAddCandidate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nama Kain / Bahan</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Cotton Combed 30s"
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Komposisi</label>
                <input
                  type="text"
                  placeholder="misal: 100% Cotton"
                  value={newComposition}
                  onChange={(e) => setNewComposition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">GSM (Gramasi)</label>
                <input
                  type="number"
                  value={newGsm}
                  onChange={(e) => setNewGsm(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-1.5 px-3 bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Simpan Kandidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
