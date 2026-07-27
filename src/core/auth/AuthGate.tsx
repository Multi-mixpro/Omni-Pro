import { FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Navigate } from '@/app/router/simpleRouter';
import { signIn, useAuth } from './useAuth';

export function AuthGate() {
  const auth = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (auth.data?.session && auth.data.profile) return <Navigate to="/app/today" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn(identifier, password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Tidak dapat masuk saat ini.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story">
        <div className="login-brand"><span className="brand-mark">GG</span><div><b>GG Indo Apparel</b><small>Product Launch OS</small></div></div>
        <div className="login-copy">
          <span className="eyebrow eyebrow-light">Satu ruang kerja. Satu tujuan.</span>
          <h1>Dari gambar referensi menjadi artikel siap produksi.</h1>
          <p>Riset, supplier, sampling, HPP, size chart, dan QC bergerak dalam satu alur yang terlihat oleh seluruh tim.</p>
        </div>
        <div className="login-proof">
          <div><ShieldCheck size={20} /><span><b>Data terpusat</b><small>Supabase bersama</small></span></div>
          <div><LockKeyhole size={20} /><span><b>Akses berdasarkan peran</b><small>4 orang, tanggung jawab jelas</small></span></div>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-mobile-brand"><span className="brand-mark">GG</span><b>Product Launch OS</b></div>
          <span className="eyebrow">Workspace internal</span>
          <h2>Selamat datang kembali</h2>
          <p className="muted">Masuk untuk melihat fokus kerja dan progres artikel hari ini.</p>

          <label className="field">
            <span>Username atau email</span>
            <input value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" placeholder="contoh: gugun" />
          </label>
          <label className="field">
            <span>Password</span>
            <div className="input-with-action">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" placeholder="Masukkan password" />
              <button type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary button-large" disabled={pending || !identifier || !password}>
            {pending ? 'Memverifikasi…' : 'Masuk ke workspace'} <ArrowRight size={18} />
          </button>
          <small className="login-help">Akses hanya untuk tim GG Indo Apparel yang telah diaktifkan.</small>
        </form>
      </section>
    </main>
  );
}
