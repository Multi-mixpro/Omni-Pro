import { ArrowRight, CalendarCheck2, Layers3, Rocket, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from '@/app/router/simpleRouter';

const systems = [
  {
    code: '01',
    name: 'Product Launch OS',
    description: 'Riset, sourcing, sampling, HPP, spesifikasi, QC, dan persetujuan artikel baru.',
    to: '/launch/login',
    status: 'Aktif',
    icon: Rocket,
    tone: 'launch',
  },
  {
    code: '02',
    name: 'Attendance',
    description: 'Kehadiran, jadwal kerja, izin, dan rekap aktivitas anggota operasional.',
    to: '/attendance/login',
    status: 'Tahap berikutnya',
    icon: CalendarCheck2,
    tone: 'attendance',
  },
  {
    code: '03',
    name: 'POS Seller',
    description: 'Penjualan, kasir, produk, stok outlet, dan laporan transaksi seller.',
    to: '/pos/login',
    status: 'Tahap berikutnya',
    icon: ShoppingBag,
    tone: 'pos',
  },
] as const;

export function SystemPortal() {
  return (
    <main className="system-portal">
      <header className="portal-header">
        <div className="portal-brand"><span className="brand-mark">GG</span><div><b>GG Indo Apparel</b><small>Business System Portal</small></div></div>
        <span className="portal-secure"><Layers3 size={17} /> Infrastruktur terpusat, akses terpisah</span>
      </header>

      <section className="portal-hero">
        <span className="eyebrow"><Sparkles size={14} /> Pusat akses sistem</span>
        <h1>Satu pintu untuk tiga ruang kerja yang berbeda.</h1>
        <p>Pilih sistem sesuai pekerjaan Anda. Setiap sistem memiliki halaman login, pengguna, peran, dan alur kerja sendiri.</p>
      </section>

      <section className="system-grid" aria-label="Pilih sistem GG Indo Apparel">
        {systems.map(system => (
          <Link className={`system-access-card system-access-${system.tone}`} to={system.to} key={system.name}>
            <div className="system-card-top"><span className="system-code">{system.code}</span><span className="system-status">{system.status}</span></div>
            <span className="system-icon"><system.icon size={29} /></span>
            <div className="system-card-copy"><h2>{system.name}</h2><p>{system.description}</p></div>
            <span className="system-enter">Masuk ke sistem <ArrowRight size={18} /></span>
          </Link>
        ))}
      </section>

      <footer className="portal-footer"><span>GG Supply</span><i /> <span>Gudskuy</span><small>Bagian dari GG Indo Apparel</small></footer>
    </main>
  );
}
