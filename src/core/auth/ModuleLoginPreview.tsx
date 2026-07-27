import { ArrowLeft, CalendarCheck2, LockKeyhole, ShoppingBag } from 'lucide-react';
import { Link } from '@/app/router/simpleRouter';

interface ModuleLoginPreviewProps {
  system: 'Attendance' | 'POS Seller';
}

export function ModuleLoginPreview({ system }: ModuleLoginPreviewProps) {
  const attendance = system === 'Attendance';
  const Icon = attendance ? CalendarCheck2 : ShoppingBag;
  const description = attendance
    ? 'Kehadiran, jadwal kerja, izin, dan rekap tim operasional.'
    : 'Kasir, transaksi, produk, stok outlet, dan laporan seller.';

  return (
    <main className={`module-login-page ${attendance ? 'module-attendance' : 'module-pos'}`}>
      <section className="module-login-context">
        <Link className="portal-back" to="/"><ArrowLeft size={18} /> Kembali ke semua sistem</Link>
        <div className="module-login-heading"><span className="module-login-icon"><Icon size={30} /></span><span className="eyebrow">Sistem terpisah</span><h1>{system}</h1><p>{description}</p></div>
        <div className="module-separation-note"><LockKeyhole size={19} /><div><b>Akses khusus {system}</b><small>Akun dan hak akses Product Launch tidak otomatis membuka sistem ini.</small></div></div>
      </section>

      <section className="login-panel">
        <form className="login-card module-preview-card" onSubmit={event => event.preventDefault()}>
          <div className="login-mobile-brand"><span className="brand-mark">GG</span><b>{system}</b></div>
          <span className="eyebrow">Tahap pengembangan berikutnya</span>
          <h2>Login {system}</h2>
          <p className="muted">Halaman akses sudah dipisahkan. Fungsi sistem akan diaktifkan setelah Product Launch OS stabil.</p>
          <label className="field"><span>Username atau email</span><input disabled placeholder="Akan aktif pada tahap berikutnya" /></label>
          <label className="field"><span>Password</span><input disabled type="password" placeholder="••••••••" /></label>
          <button className="button button-large" disabled>Sistem belum diaktifkan</button>
          <small className="login-help">Tidak ada data Product Launch yang ditampilkan di ruang ini.</small>
        </form>
      </section>
    </main>
  );
}
