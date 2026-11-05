import { ArrowRight, Megaphone, Rocket } from 'lucide-react';
import { Link, useNavigate } from './simpleRouter';
import { signOut } from '@/core/auth/useAuth';

const workspaces = [
  { to: '/launch/app/today', title: 'Launching Artikel', description: 'Kelola pipeline artikel, sampel, produksi, dan kesiapan peluncuran.', icon: Rocket, color: 'bg-sky-100 text-sky-800' },
  { to: '/launch/app/creative', title: 'Creative Dashboard', description: 'Simpan ide dan referensi, susun tugas konten, dan pantau kampanye promo.', icon: Megaphone, color: 'bg-teal-100 text-teal-800' },
];

export function WorkspacePicker({ name }: { name: string }) {
  const navigate = useNavigate();
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-teal-800">Omni Pro</span>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
          onClick={async () => { await signOut(); navigate('/launch/login'); }}>Keluar</button>
      </div>
      <p className="mb-2 text-sm font-medium text-slate-600">Halo, {name}</p>
      <h1 className="text-3xl font-bold sm:text-4xl">Pilih ruang kerja</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {workspaces.map(({ to, title, description, icon: Icon, color }) =>
          <Link key={to} to={to} className="group flex flex-col items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700">
            <span className={'rounded-xl p-3 ' + color}><Icon size={24} /></span>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800">Buka ruang kerja <ArrowRight size={16} /></span>
          </Link>
        )}
      </div>
    </div>
  </main>;
}
