import React, { useState } from 'react';
import { Layers, Award } from 'lucide-react';

interface SampleItem {
  id: string;
  version_no: number;
  sample_code: string;
  status: 'DRAFT' | 'REVISION' | 'APPROVED' | 'MASTER';
  sample_date: string;
  material_summary: string;
  result_summary: string;
  is_master_sample: boolean;
}

export const SampleFixTab: React.FC<{ workOrderId: string }> = () => {
  const [samples, setSamples] = useState<SampleItem[]>([
    {
      id: '1',
      version_no: 1,
      sample_code: 'SMP-GGS-001-v1',
      status: 'REVISION',
      sample_date: '2026-07-10',
      material_summary: 'Cotton Combed 30s',
      result_summary: 'Ukuran dada kurang 1.5cm, jahitan kerah perlu dirapikan',
      is_master_sample: false,
    },
    {
      id: '2',
      version_no: 2,
      sample_code: 'SMP-GGS-001-v2',
      status: 'MASTER',
      sample_date: '2026-07-20',
      material_summary: 'Cotton Combed 30s Reaktif',
      result_summary: 'PASSED — Semua spesifikasi ukuran & konstruksi sesuai',
      is_master_sample: true,
    },
  ]);

  const handleSetMaster = (id: string) => {
    setSamples(
      samples.map(s => ({
        ...s,
        is_master_sample: s.id === id,
        status: s.id === id ? 'MASTER' : 'APPROVED',
      }))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">Tahap 5: Iterasi Sampel Fisik (Master Sample)</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracking histori versi sampel v1, v2, v3 hingga penetapan Master Sample
            </p>
          </div>
        </div>
      </div>

      {/* Version Timeline Cards */}
      <div className="space-y-4">
        {samples.map((s) => (
          <div
            key={s.id}
            className={`p-5 rounded-2xl border transition ${
              s.is_master_sample
                ? 'bg-amber-500/5 border-amber-500/30'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center font-mono">
                  v{s.version_no}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-white">{s.sample_code}</h4>
                    {s.is_master_sample && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Award className="w-3 h-3" />
                        <span>MASTER SAMPLE</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{s.material_summary}</p>
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                  s.status === 'MASTER'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : s.status === 'REVISION'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}
              >
                {s.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 mt-3">
              {s.result_summary}
            </p>

            {!s.is_master_sample && (
              <div className="pt-3 flex justify-end">
                <button
                  onClick={() => handleSetMaster(s.id)}
                  className="py-1.5 px-3 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Set Sebagai Master Sample</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
