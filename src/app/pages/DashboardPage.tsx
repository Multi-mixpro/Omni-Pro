import React from 'react';
import { useAuth } from '@/core/auth/AuthProvider';
import { Rocket, Clock, CheckCircle, AlertTriangle, Layers } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { profile, roles } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/20">
        <h1 className="text-xl font-bold text-white mb-1">
          Selamat Datang, {profile?.full_name || 'Pengguna'} 👋
        </h1>
        <p className="text-xs text-slate-300">
          Role Anda: <span className="font-semibold text-blue-400 uppercase">{roles[0] || 'Member'}</span> — GG Product Operating System
        </p>
      </div>

      {/* Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Artikel Aktif</p>
            <p className="text-lg font-bold text-white">0</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Overdue</p>
            <p className="text-lg font-bold text-white">0</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Waiting Review</p>
            <p className="text-lg font-bold text-white">0</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Published</p>
            <p className="text-lg font-bold text-white">0</p>
          </div>
        </div>
      </div>

      {/* Perintah Kerja Preview Empty State */}
      <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center">
        <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-200">Belum Ada Perintah Kerja Artikel</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
          Buat Perintah Kerja (Work Order) pertama untuk memulai pengorganisasian 8-stage launching artikel.
        </p>
      </div>
    </div>
  );
};
