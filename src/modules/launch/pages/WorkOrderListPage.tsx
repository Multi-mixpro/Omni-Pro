import React from 'react';
import { useNavigate } from 'react-router-dom';

export const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock data matching simulation HTML exactly for seamless display
  const orders = [
    {
      id: 'o1',
      code: 'GS-WB-001',
      brand: 'GG Supply',
      name: 'Windbreaker Polos Kombinasi',
      stage: 'Fix Sampel',
      pic: 'Yadi',
      priority: 'Tinggi',
      due: '06 Agt 2026',
      prog: 63,
      status: 'doing',
      users: ['DA', 'YD', 'SY'],
    },
    {
      id: 'o2',
      code: 'GD-VR-001',
      brand: 'GUDSKUY',
      name: 'Varsity Classic Jade',
      stage: 'Riset Bahan',
      pic: 'Dodi Awaludin',
      priority: 'Tinggi',
      due: '12 Agt 2026',
      prog: 25,
      status: 'doing',
      users: ['YD', 'DA', 'SY'],
    },
    {
      id: 'o3',
      code: 'GS-PL-001',
      brand: 'GG Supply',
      name: 'Polo Shirt Corporate',
      stage: 'Fix Warna',
      pic: 'Dodi Awaludin',
      priority: 'Normal',
      due: '02 Agt 2026',
      prog: 38,
      status: 'review',
      users: ['DA', 'YD', 'SY'],
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Hero */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
            EXECUTION BOARD
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">Perintah Kerja</h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Owner memantau seluruh task. Anggota tim hanya melihat artikel yang ditugaskan dan memperbarui bagian sesuai izin akses.
          </p>
        </div>

        <button
          onClick={() => navigate('/app/launch/work-orders/new')}
          className="py-2.5 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center space-x-2 shrink-0 transition"
        >
          <span>＋ Perintah Baru</span>
        </button>
      </div>

      {/* Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center space-x-3">
        <span className="text-orange-400 font-bold">◉</span>
        <div>
          <strong className="text-white">Mode Owner:</strong> seluruh perintah, task lintas tim, bottleneck, dan keterlambatan terlihat di halaman ini.
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <button className="px-3 py-1.5 rounded-full bg-white text-slate-950 font-bold text-xs">
            Semua
          </button>
          <button className="px-3 py-1.5 rounded-full bg-slate-900 text-slate-400 font-semibold text-xs border border-slate-800 hover:text-white">
            GG Supply
          </button>
          <button className="px-3 py-1.5 rounded-full bg-slate-900 text-slate-400 font-semibold text-xs border border-slate-800 hover:text-white">
            GUDSKUY
          </button>
          <button className="px-3 py-1.5 rounded-full bg-slate-900 text-slate-400 font-semibold text-xs border border-slate-800 hover:text-white">
            Terlambat
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Cari artikel, kode, PIC..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Column 1: Belum Dimulai */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 min-h-[400px] space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300 px-1">
            <span>Belum Dimulai</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">0</span>
          </div>
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800/60 rounded-xl">
            Belum ada artikel
          </div>
        </div>

        {/* Column 2: Sedang Dikerjakan */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 min-h-[400px] space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300 px-1">
            <span>Sedang Dikerjakan</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">2</span>
          </div>

          {orders.filter(o => o.status === 'doing').map((o) => (
            <div
              key={o.id}
              onClick={() => navigate(`/app/launch/work-orders/${o.id}`)}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                    o.brand === 'GG Supply' ? 'bg-orange-500/20 text-orange-400' : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {o.brand}
                </span>
                <span className="text-[10px] text-red-400 font-semibold">{o.priority}</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white">{o.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{o.code} • {o.stage}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Progres</span>
                  <span>{o.prog}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-orange-500 h-full" style={{ width: `${o.prog}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex -space-x-1.5">
                  {o.users.map((u, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-md bg-purple-600 text-white font-black text-[8px] flex items-center justify-center border border-slate-900"
                    >
                      {u}
                    </div>
                  ))}
                </div>
                <span className="text-[10px] text-slate-400">{o.due}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Column 3: Menunggu Review */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 min-h-[400px] space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300 px-1">
            <span>Menunggu Review</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px]">1</span>
          </div>

          {orders.filter(o => o.status === 'review').map((o) => (
            <div
              key={o.id}
              onClick={() => navigate(`/app/launch/work-orders/${o.id}`)}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">
                  {o.brand}
                </span>
                <span className="text-[10px] text-slate-400">{o.priority}</span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white">{o.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">{o.code} • {o.stage}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>Progres</span>
                  <span>{o.prog}%</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full" style={{ width: `${o.prog}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Column 4: Artikel Final */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 min-h-[400px] space-y-3">
          <div className="flex justify-between items-center text-xs font-bold text-slate-300 px-1">
            <span>Artikel Final</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">0</span>
          </div>
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800/60 rounded-xl">
            Belum ada artikel final
          </div>
        </div>
      </div>
    </div>
  );
};
