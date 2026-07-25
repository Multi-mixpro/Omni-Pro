import React from 'react';

export const BrandsOverviewPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">
          DUA PERUSAHAAN, SATU SISTEM OPERASIONAL
        </span>
        <h1 className="text-2xl font-black text-white mt-1">GG Supply & GUDSKUY</h1>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl">
          Tujuan pasar berbeda, tetapi data artikel dan workflow produksi menggunakan standar yang sama agar mudah dikontrol oleh Owner & Tim.
        </p>
      </div>

      {/* Brand Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GG Supply Panel */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-600 to-amber-700 text-white relative overflow-hidden space-y-4 shadow-xl">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-white/20 text-white">
              BRAND APPAREL & MENSWEAR
            </span>
            <h2 className="text-2xl font-black">GG Supply</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Produksi pakaian polosan siap stok dan layanan custom untuk mitra percetakan, komunitas, corporate, sekolah, resto, bengkel, pabrik, dan pelanggan perorangan.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-white/20 pt-4 text-center">
            <div>
              <p className="text-xl font-black">2</p>
              <p className="text-[10px] text-white/70">Artikel Aktif</p>
            </div>
            <div>
              <p className="text-xl font-black">75%</p>
              <p className="text-[10px] text-white/70">Kesiapan</p>
            </div>
            <div>
              <p className="text-xl font-black">1</p>
              <p className="text-[10px] text-white/70">Artikel Final</p>
            </div>
          </div>
        </div>

        {/* GUDSKUY Panel */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-purple-950 text-white relative overflow-hidden space-y-4 shadow-xl border border-purple-500/30">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              BRAND STREETWEAR & CASUAL WEAR
            </span>
            <h2 className="text-2xl font-black">GUDSKUY</h2>
            <p className="text-xs text-white/80 leading-relaxed">
              Brand fashion mandiri untuk daily wear, sportswear, outdoor, streetwear, casual wear, dan koleksi artikel bertahap.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center">
            <div>
              <p className="text-xl font-black">1</p>
              <p className="text-[10px] text-white/70">Artikel Aktif</p>
            </div>
            <div>
              <p className="text-xl font-black">50%</p>
              <p className="text-[10px] text-white/70">Kesiapan</p>
            </div>
            <div>
              <p className="text-xl font-black">0</p>
              <p className="text-[10px] text-white/70">Artikel Final</p>
            </div>
          </div>
        </div>
      </div>

      {/* Standardized 8-Stage Flow Visual */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 space-y-4">
        <h3 className="font-bold text-sm text-white border-b border-slate-800 pb-3">
          Workflow 8-Stage Terstandar Sistem
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
          {[
            { step: '01', title: 'Brief Artikel', desc: 'Nama, warna, foto, link, target' },
            { step: '02', title: 'Riset Bahan', desc: 'Kandidat kain dan konsumsi' },
            { step: '03', title: 'Fix Supplier', desc: 'Harga, MOQ, warna, aksesori' },
            { step: '04', title: 'Fix Warna', desc: 'Swatch dan kode warna final' },
            { step: '05', title: 'Fix Sampel', desc: 'Sampel awal, revisi, master' },
            { step: '06', title: 'Fix HPP', desc: 'Seluruh variabel biaya nyata' },
            { step: '07', title: 'Size Chart', desc: 'Ukuran baku dan toleransi' },
            { step: '08', title: 'Artikel Final', desc: 'QC dan approval Owner' },
          ].map((s) => (
            <div key={s.step} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-mono font-bold text-orange-400">{s.step}</span>
              <h4 className="text-xs font-bold text-slate-200">{s.title}</h4>
              <p className="text-[9px] text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
