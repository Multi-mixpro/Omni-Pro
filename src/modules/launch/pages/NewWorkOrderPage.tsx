import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workOrderRepository } from '@/modules/launch/data/workOrderRepository';
import { useAuth } from '@/core/auth/AuthProvider';
import { ArrowLeft, Rocket } from 'lucide-react';

export const NewWorkOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [brandId, setBrandId] = useState('');
  const [articleCode, setArticleCode] = useState('');
  const [articleName, setArticleName] = useState('');
  const [category, setCategory] = useState('TOPS');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [error, setError] = useState<string | null>(null);

  // Fetch Brands
  const { data: brands = [] } = useQuery({
    queryKey: ['launch-brands'],
    queryFn: () => workOrderRepository.getBrands(),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!brandId || !articleCode || !articleName) {
        throw new Error('Harap isi brand, kode artikel, dan nama artikel');
      }
      return workOrderRepository.createWorkOrder(
        {
          brand_id: brandId,
          article_code: articleCode.toUpperCase().trim(),
          article_name: articleName.trim(),
          category,
          description,
          priority,
          custom_capability: false,
        },
        user?.id || ''
      );
    },
    onSuccess: (newWo) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      navigate(`/app/launch/work-orders/${newWo.id}`);
    },
    onError: (err: any) => {
      setError(err.message || 'Gagal membuat Perintah Kerja baru');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Back Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => navigate('/app/launch/work-orders')}
          className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-white">Buat Perintah Kerja Artikel Baru</h1>
          <p className="text-xs text-slate-400">Brief Tahap 1: Inisialisasi Perintah Kerja Artikel</p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Brand Artikel *
              </label>
              <select
                required
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="">Pilih Brand...</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Kode Artikel Unik *
              </label>
              <input
                type="text"
                required
                placeholder="misal: GGS-KAOS-001"
                value={articleCode}
                onChange={(e) => setArticleCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nama Artikel Produk *
              </label>
              <input
                type="text"
                required
                placeholder="misal: Kaos Polos Heavyweight"
                value={articleName}
                onChange={(e) => setArticleName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Kategori Produk
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="TOPS">Tops / Atasan</option>
                <option value="BOTTOMS">Bottoms / Bawahan</option>
                <option value="OUTERWEAR">Outerwear / Jaket</option>
                <option value="DRESS">Dress / Setelan</option>
                <option value="ACCESSORIES">Aksesori</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Prioritas Pengerjaan
            </label>
            <div className="flex space-x-3">
              {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                    priority === p
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Deskripsi & Catatan Brief awal
            </label>
            <textarea
              rows={4}
              placeholder="Jelaskan spesifikasi ide, target pasar, atau catatan khusus produksi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/app/launch/work-orders')}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/25 flex items-center space-x-2 disabled:opacity-50"
            >
              <Rocket className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Memproses...' : 'Aktifkan Perintah Kerja'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
