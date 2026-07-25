import React from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { Rocket, CheckCircle2, AlertTriangle, TrendingUp, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
            PUSAT OPERASIONAL LAUNCHING
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">
            Selamat Datang, {currentUser.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Kelola peluncuran artikel GG Supply dan GUDSKUY melalui workflow yang terukur, terdokumentasi, dan tersinkron antara Owner, riset, sourcing, produksi, HPP, sampling, size chart, serta approval artikel final.
          </p>
        </div>

        {currentUser.p.create && (
          <button
            onClick={() => (window.location.href = '/app/launch/work-orders/new')}
            className="py-2.5 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center space-x-2 shrink-0 transition"
          >
            <span>＋ Buat Perintah Kerja</span>
          </button>
        )}
      </div>

      {/* KPI Cards (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-xl font-black">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">3</p>
            <p className="text-xs text-slate-400">Task Aktif</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xl font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">1</p>
            <p className="text-xs text-slate-400">Artikel Final</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl font-black">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">1</p>
            <p className="text-xs text-slate-400">Perlu Perhatian</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl font-black">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-white">65%</p>
            <p className="text-xs text-slate-400">Kesiapan Rata-rata</p>
          </div>
        </div>
      </div>

      {/* Grid 2 Columns: Brand Progress & User Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Perusahaan */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Progress Launching Per Brand</h2>
              <p className="text-xs text-slate-400">Rangkuman kesiapan dua perusahaan</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              BERJALAN
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">GG Supply</span>
                <span className="text-orange-400 font-bold">75%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-amber-400 h-full w-[75%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">GUDSKUY</span>
                <span className="text-purple-400 font-bold">50%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full w-[50%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Fokus Pengguna Aktif */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white">Fokus Pengguna Aktif</h2>
            <p className="text-xs text-slate-400">Task terdekat sesuai penugasan Anda</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 font-bold text-xs flex items-center justify-center">
                  65%
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Windbreaker Polos Kombinasi</h4>
                  <p className="text-[10px] text-slate-400">Fix Sampel • PIC: Yadi</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                Dikerjakan
              </span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 font-bold text-xs flex items-center justify-center">
                  25%
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Varsity Classic Jade</h4>
                  <p className="text-[10px] text-slate-400">Riset Bahan • PIC: Dodi</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Review
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
        <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          Aktivitas & Log Sistem Terbaru
        </h2>
        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-3 text-slate-300">
            <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Memperbarui Sampel 02 Windbreaker menjadi proses.</p>
              <p className="text-[10px] text-slate-500">Oleh Yadi • Hari ini, 15:20</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-slate-300">
            <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Menambahkan supplier zipper waterproof.</p>
              <p className="text-[10px] text-slate-500">Oleh Syaikhu • Hari ini, 11:10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
