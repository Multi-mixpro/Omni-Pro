import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { workOrderRepository } from '../data/workOrderRepository';
import { Rocket, Plus, Layers, Search, AlertCircle } from 'lucide-react';

export const WorkOrderListPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: workOrders = [], isLoading, error } = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => workOrderRepository.getWorkOrders(),
  });

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Rocket className="w-5 h-5 text-blue-500" />
            <span>Perintah Kerja Artikel</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar alur pengerjaan launching artikel GG Supply & GUDSKUY
          </p>
        </div>

        <button
          onClick={() => navigate('/app/launch/work-orders/new')}
          className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Perintah Kerja</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari kode artikel atau nama produk..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-xs">Memuat daftar perintah kerja...</div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>Gagal mengambil data dari Supabase. Pastikan tabel & RLS sudah terkonfigurasi.</span>
        </div>
      ) : workOrders.length === 0 ? (
        <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-2xl">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">Belum Ada Perintah Kerja Artikel</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Buat perintah kerja pertama untuk memulai alur launching 8-stage artikel produk.
          </p>
          <button
            onClick={() => navigate('/app/launch/work-orders/new')}
            className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
          >
            Buat Perintah Kerja Baru
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workOrders.map((wo) => (
            <div
              key={wo.id}
              onClick={() => navigate(`/app/launch/work-orders/${wo.id}`)}
              className="p-5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition space-y-4 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {wo.launch_brands?.name || 'Brand'}
                  </span>
                  <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition mt-2">
                    {wo.article_name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{wo.article_code}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                  {wo.overall_status}
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Stage: {wo.current_stage_code}</span>
                  <span>{wo.progress_percent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${wo.progress_percent}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
