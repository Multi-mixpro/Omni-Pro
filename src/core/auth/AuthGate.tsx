import { FormEvent, useState } from 'react';
import {
  ArrowRight,
  Database,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  Shirt,
  Users,
} from 'lucide-react';
import { Navigate } from '@/app/router/simpleRouter';
import { signIn, signOut, useAuth } from './useAuth';

export function AuthGate() {
  const auth = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLaunchAccess = auth.data?.permissions.includes('launch.view') || auth.data?.permissions.includes('launch.admin');

  if (auth.data?.session && auth.data.profile && hasLaunchAccess) return <Navigate to="/launch/app/today" replace />;

  if (auth.data?.session && auth.data.profile && !hasLaunchAccess) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(8,126,121,0.16),_transparent_22rem),linear-gradient(180deg,#f7fafb,#eff4f6)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
          <div className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-700">
              <LockKeyhole size={28} />
            </div>
            <div className="mt-5 space-y-3">
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-amber-700">
                Akses Product Launch
              </span>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                Akun ini belum memiliki akses ke Product Launch OS.
              </h1>
              <p className="text-sm leading-6 text-slate-600">
                Gunakan akun yang sudah diberi role Product Launch oleh owner/admin, atau keluar untuk masuk dengan akun lain.
              </p>
            </div>
            <div className="mt-6">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#087E79] px-5 text-sm font-bold text-white transition hover:bg-[#066864]"
                onClick={() => void signOut()}
              >
                Gunakan akun lain <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(8,126,121,0.16),_transparent_20rem),radial-gradient(circle_at_bottom_left,_rgba(79,95,199,0.10),_transparent_24rem),linear-gradient(180deg,#f7fafb,#eef4f6)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_430px] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[32px] bg-[linear-gradient(145deg,#0e1f24,#13353a_52%,#0f2a30)] p-6 text-white shadow-[0_28px_90px_rgba(10,22,28,0.28)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,198,0.20),_transparent_18rem),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.08),_transparent_20rem)]" />
          <div className="relative flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-teal-100">
                <ShieldCheck size={14} />
                Workspace internal
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-3xl bg-[#087E79] text-base font-black shadow-[0_14px_38px_rgba(8,126,121,0.35)]">
                GG
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-white">GG Indo Apparel</p>
                <p className="text-xs font-semibold text-teal-100/85">Product Launch OS</p>
              </div>
            </div>

            <div className="mt-8 max-w-2xl">
              <span className="inline-flex rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-teal-100">
                Satu alur kerja terpadu
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.04em] text-white sm:text-5xl">
                Masuk ke ruang kerja Product Launch yang senada dengan operasi harian tim.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                Brief, riset, supplier, sampling, HPP, size chart, QC, dan persiapan produksi bergerak dalam satu workspace yang rapi, cepat, dan mudah diawasi owner maupun tim inti.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                {
                  icon: Shirt,
                  title: 'Pipeline Artikel',
                  copy: 'Pantau artikel aktif, prioritas, dan readiness dalam satu board.',
                },
                {
                  icon: Database,
                  title: 'Data Terpusat',
                  copy: 'Akses brief, costing, media, dan gate approval dari sumber yang sama.',
                },
                {
                  icon: Users,
                  title: 'Akses Terkendali',
                  copy: 'Hak akses tim, role, dan izin rilis dikelola owner secara terstruktur.',
                },
              ].map(({ icon: Icon, title, copy }) => (
                <div
                  key={title}
                  className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-teal-100">
                    <Icon size={18} />
                  </div>
                  <h2 className="mt-4 text-sm font-extrabold text-white">{title}</h2>
                  <p className="mt-1 text-xs leading-6 text-slate-200/85">{copy}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto hidden lg:block">
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/7 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-100">Kontrol Owner</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Pengguna, role, dan akses rilis artikel dikelola dari satu halaman pengaturan yang sama.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/7 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-teal-100">Siap Produksi</p>
                  <p className="mt-2 text-sm text-slate-200">
                    Gunakan akun tim aktif untuk melihat fokus kerja, status gate, dan progres produksi terbaru.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex">
          <form
            className="flex w-full flex-col rounded-[32px] border border-slate-200 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8"
            onSubmit={submit}
          >
            <div className="flex items-center justify-end gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#087E79] text-sm font-black text-white">
                GG
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#087E79]/8 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#087E79]">
              <ShieldCheck size={14} />
              Product Launch Login
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-900">
              Selamat datang kembali
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Masuk untuk membuka workspace Product Launch, melihat prioritas tim, dan melanjutkan progres artikel tanpa pindah-pindah sistem.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Login cepat</p>
                <p className="mt-2 text-sm font-bold text-slate-900">Pakai username internal</p>
                <p className="mt-1 text-xs leading-6 text-slate-600">Masukkan username tim atau email akun yang sudah diaktifkan.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Aman per role</p>
                <p className="mt-2 text-sm font-bold text-slate-900">PIN / password terproteksi</p>
                <p className="mt-1 text-xs leading-6 text-slate-600">Hak akses mengikuti role Product Launch yang ditetapkan owner/admin.</p>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  Username atau email
                </span>
                <input
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  autoComplete="username"
                  placeholder="contoh: gugun"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087E79] focus:ring-4 focus:ring-[#087E79]/10"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                  PIN / password
                </span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Masukkan PIN atau password"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#087E79] focus:ring-4 focus:ring-[#087E79]/10"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    onClick={() => setShowPassword(value => !value)}
                    className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </div>
            )}

            <button
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#087E79] px-5 text-sm font-bold text-white transition hover:bg-[#066864] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending || !identifier || !password}
            >
              {pending ? 'Memverifikasi…' : 'Masuk ke workspace'} <ArrowRight size={18} />
            </button>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-6 text-slate-600">
              Akses hanya untuk tim GG Indo Apparel yang sudah aktif. Jika akun belum bisa masuk, cek role dan status pengguna dari menu pengaturan owner.
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
