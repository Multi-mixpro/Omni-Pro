import React, { useState } from 'react';
import { ShieldCheck, Award } from 'lucide-react';

interface QcCheckItem {
  id: string;
  category: string;
  item_name: string;
  check_point: string;
  is_required: boolean;
  result: 'PASS' | 'FAIL' | 'NA';
}

export const QcFinalTab: React.FC<{ workOrderId: string }> = () => {
  const [items, setItems] = useState<QcCheckItem[]>([
    {
      id: '1',
      category: 'Konstruksi & Jahitan',
      item_name: 'Kerapihan Stik Kerah',
      check_point: 'Jahitan rantai leher rapi tanpa loncat benang',
      is_required: true,
      result: 'PASS',
    },
    {
      id: '2',
      category: 'Simetri & Spesifikasi',
      item_name: 'Simetri Bahu Kiri-Kanan',
      check_point: 'Toleransi simetri maks 0.5cm',
      is_required: true,
      result: 'PASS',
    },
    {
      id: '3',
      category: 'Aksesori & Finishing',
      item_name: 'Kekuatan Kancing & Hangtag',
      check_point: 'Kancing terpasang kencang dan hangtag fisik terpasang',
      is_required: true,
      result: 'PASS',
    },
  ]);

  const [isApproved, setIsApproved] = useState(false);

  const handleSetResult = (id: string, result: 'PASS' | 'FAIL' | 'NA') => {
    setItems(items.map(i => i.id === id ? { ...i, result } : i));
  };

  const allRequiredPassed = items.filter(i => i.is_required).every(i => i.result === 'PASS');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white">Tahap 8: Quality Control & Owner Approval</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isApproved
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isApproved ? 'ARTICLE APPROVED' : 'WAITING OWNER APPROVAL'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemeriksaan checklist QC teknis final dan persetujuan publish Owner
            </p>
          </div>
        </div>

        {allRequiredPassed && !isApproved && (
          <button
            onClick={() => setIsApproved(true)}
            className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2 shrink-0"
          >
            <Award className="w-4 h-4" />
            <span>Owner Approve Artikel</span>
          </button>
        )}
      </div>

      {/* QC Checklist Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Check Point Item</th>
              <th className="p-3">Kriteria Spesifikasi</th>
              <th className="p-3 text-center">Status Requirement</th>
              <th className="p-3 text-center">Hasil QC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.map((i) => (
              <tr key={i.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-semibold text-slate-200">{i.item_name}</td>
                <td className="p-3 text-slate-400">{i.check_point}</td>
                <td className="p-3 text-center">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                    {i.is_required ? 'REQUIRED (*)' : 'OPTIONAL'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center space-x-1">
                    {(['PASS', 'FAIL', 'NA'] as const).map((res) => (
                      <button
                        key={res}
                        disabled={isApproved}
                        onClick={() => handleSetResult(i.id, res)}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          i.result === res
                            ? res === 'PASS'
                              ? 'bg-emerald-500 text-white'
                              : res === 'FAIL'
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-700 text-white'
                            : 'bg-slate-950 text-slate-500 border border-slate-800'
                        }`}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
