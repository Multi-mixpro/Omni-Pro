import React, { useState } from 'react';
import { Ruler, CheckCircle2 } from 'lucide-react';

interface SizePoint {
  id: string;
  name: string;
  s: number;
  m: number;
  l: number;
  xl: number;
  tolerance: string;
}

export const SizeChartFixTab: React.FC<{ workOrderId: string }> = () => {
  const [points] = useState<SizePoint[]>([
    { id: '1', name: 'Lebar Dada (Chest Width)', s: 48, m: 50, l: 52, xl: 54, tolerance: '± 1 cm' },
    { id: '2', name: 'Panjang Badan (Body Length)', s: 68, m: 70, l: 72, xl: 74, tolerance: '± 1 cm' },
    { id: '3', name: 'Panjang Lengan (Sleeve Length)', s: 20, m: 21, l: 22, xl: 23, tolerance: '± 0.5 cm' },
  ]);

  const [isFinal, setIsFinal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Ruler className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-sm text-white">Tahap 7: Matriks Spesifikasi Size Chart</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  isFinal
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isFinal ? 'FINAL (LOCKED)' : 'DRAFT'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Tabel matriks ukuran per titik ukur (S, M, L, XL) beserta batas toleransi potong/jahit
            </p>
          </div>
        </div>

        {!isFinal && (
          <button
            onClick={() => setIsFinal(true)}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2 shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finalisasi Size Chart</span>
          </button>
        )}
      </div>

      {/* Dynamic Size Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3">Titik Pengukuran</th>
              <th className="p-3 text-center">S</th>
              <th className="p-3 text-center">M</th>
              <th className="p-3 text-center">L</th>
              <th className="p-3 text-center">XL</th>
              <th className="p-3 text-center">Toleransi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {points.map((pt) => (
              <tr key={pt.id} className="hover:bg-slate-800/40">
                <td className="p-3 font-sans font-semibold text-slate-200">{pt.name}</td>
                <td className="p-3 text-center font-bold text-blue-400">{pt.s} cm</td>
                <td className="p-3 text-center font-bold text-blue-400">{pt.m} cm</td>
                <td className="p-3 text-center font-bold text-blue-400">{pt.l} cm</td>
                <td className="p-3 text-center font-bold text-blue-400">{pt.xl} cm</td>
                <td className="p-3 text-center text-slate-400">{pt.tolerance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
