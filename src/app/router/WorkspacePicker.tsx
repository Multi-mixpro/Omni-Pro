import { ArrowRight, Megaphone, Rocket } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from './simpleRouter';
import { signOut } from '@/core/auth/useAuth';
import { businessOverview, unitSectors, useWorkspaceUnits } from '@/modules/launch/data/businessWorkspace';
import { jakartaToday } from '@/modules/launch/creative/schedule';
import { UNASSIGNED_BUSINESS_UNIT } from '@/modules/launch/paten/services/businessUnits';

const workspaces = [
  { to: '/launch/app/today', title: 'Launching Artikel', description: 'Kelola pipeline artikel, sampel, produksi, dan kesiapan peluncuran.', icon: Rocket, color: 'bg-sky-100 text-sky-800' },
  { to: '/launch/app/creative', title: 'Creative Dashboard', description: 'Simpan ide dan referensi, susun tugas konten, dan pantau kampanye promo.', icon: Megaphone, color: 'bg-teal-100 text-teal-800' },
];

export function WorkspacePicker({ name, userId, jobTitle, permissions }: {
  name: string; userId: string; jobTitle?: string | null; permissions: string[];
}) {
  const navigate = useNavigate();
  const isAdmin = permissions.includes('launch.admin');
  const role = jobTitle || (isAdmin ? 'Admin / Owner' : permissions.includes('launch.approve') ? 'Reviewer' : 'Anggota tim');
  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
    <div className="mx-auto max-w-4xl">
      <div className="mb-12 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-teal-800">Omni Pro</span>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
          onClick={async () => { await signOut(); navigate('/launch/login'); }}>Keluar</button>
      </div>
      <p className="mb-2 text-sm font-medium text-slate-600">Halo, {name} · {role}</p>
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
      {isAdmin ? <BusinessOverview userId={userId} /> : (
        <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
          <h2 className="font-bold">Mulai dari tugas Anda</h2>
          <p className="mt-1 text-sm text-slate-700">Lihat pekerjaan yang ditugaskan kepada Anda dari semua unit bisnis.</p>
          <Link to="/launch/app/creative?mine=1" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-teal-800">Tugas kreatif saya <ArrowRight size={16} /></Link>
        </div>
      )}
    </div>
  </main>;
}

function BusinessOverview({ userId }: { userId: string }) {
  const today = jakartaToday();
  const units = useWorkspaceUnits();
  const overview = useQuery({ queryKey: ['business-execution', userId, today],
    queryFn: ({ signal }) => businessOverview(today, signal) });
  const names = new Map(units.data?.map(unit => [unit.id, unit]));
  const rows = [...(overview.data ?? [])].sort((a, b) =>
    (names.get(a.unit_id ?? '')?.name ?? 'Unit belum ditetapkan')
      .localeCompare(names.get(b.unit_id ?? '')?.name ?? 'Unit belum ditetapkan', 'id'));
  return <section className="mt-8 space-y-3" aria-label="Ringkasan lintas usaha">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h2 className="text-lg font-bold">Ringkasan lintas usaha</h2>
        <p className="text-sm text-slate-600">Artikel aktif dan target kreatif minggu ini per unit bisnis.</p></div>
      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold" disabled={overview.isFetching}
          onClick={() => { void overview.refetch(); void units.refetch(); }}>Segarkan</button>
        <Link to="/launch/app/settings" className="rounded-lg bg-teal-800 px-3 py-2 text-sm font-semibold text-white">Kelola unit &amp; tim</Link>
      </div>
    </div>
    {(overview.isPending || units.isPending) && <p role="status" className="text-sm text-slate-600">Memuat unit bisnis…</p>}
    {(overview.isError || units.isError) && <p role="alert" className="text-sm text-red-700">Ringkasan belum dapat dimuat.</p>}
    {overview.isSuccess && units.isSuccess && rows.length === 0 && <p className="text-sm text-slate-600">Belum ada unit atau pekerjaan. Tambah unit bisnis untuk mulai.</p>}
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map(row => {
        const unit = names.get(row.unit_id ?? '');
        return <article key={row.unit_id ?? 'unassigned'} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <div><h3 className="font-bold">{unit?.name ?? 'Unit belum ditetapkan'}</h3>
            {unit && <p className="text-xs text-slate-600">{unitSectors[unit.sector]}{unit.is_active ? '' : ' · Arsip'}</p>}</div>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div><dt className="text-slate-600">Artikel aktif</dt><dd className="text-lg font-bold">{row.article_count}</dd>
              <dd className={row.article_overdue ? 'text-red-700' : 'text-slate-600'}>{row.article_overdue} lewat target</dd></div>
            <div><dt className="text-slate-600">Kreatif selesai</dt><dd className="text-lg font-bold">{row.creative_closed} / {row.creative_target}</dd>
              <dd className={row.creative_overdue ? 'text-red-700' : 'text-slate-600'}>{row.creative_overdue} tugas terlambat</dd></div>
          </dl>
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-teal-800">
            <Link to={'/launch/app/today?unit=' + encodeURIComponent(unit?.name ?? UNASSIGNED_BUSINESS_UNIT)}>Buka artikel</Link>
            <Link to={'/launch/app/creative?unit=' + (row.unit_id ?? 'unassigned')}>Buka kreatif</Link>
          </div>
        </article>;
      })}
    </div>
  </section>;
}
