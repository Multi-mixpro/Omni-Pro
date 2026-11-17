import { ArrowUpRight, Users } from 'lucide-react';
import { button } from './CreativeForms';
import type { TeamMember, Workload } from './repository';

export function WeeklyProgress({ stats }: { stats: Workload }) {
  const percent = stats.week_target ? Math.round(100 * stats.week_done / stats.week_target) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap justify-between gap-1 text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-400">Target minggu ini</span>
        <strong className="tabular-nums text-indigo-700 dark:text-indigo-300">{stats.week_done} / {stats.week_target} selesai</strong>
      </div>
      <div role="progressbar" aria-label="Target tugas minggu ini" aria-valuenow={percent} className="h-2 overflow-hidden rounded-full bg-indigo-100/80 dark:bg-indigo-500/15">
        <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300" style={{ width: percent + '%' }} />
      </div>
    </div>
  );
}

const initials = (name: string) => name.trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase();

export function CreativeTeamPerformance({ members, stats, userId, loading, failed, onSelect }: {
  members: TeamMember[]; stats?: Workload[]; userId: string; loading: boolean; failed: boolean; onSelect: (id: string) => void;
}) {
  const byId = new Map(stats?.map(row => [row.subject_id, row]));
  const people = members.filter(member => member.is_active || byId.has(member.id)).sort((a,b) =>
    Number(byId.get(b.id)?.overdue_count ?? 0) - Number(byId.get(a.id)?.overdue_count ?? 0) ||
    Number(byId.get(b.id)?.open_count ?? 0) - Number(byId.get(a.id)?.open_count ?? 0) ||
    a.full_name.localeCompare(b.full_name,'id'));
  const assigned = new Set(people.map(member => member.id));
  const rows = [
    ...people.map(member => ({ id: member.id, name: member.full_name + (member.id === userId ? ' (Anda)' : ''), initials: initials(member.full_name),
      role: (member.job_title || 'Anggota tim') + (member.is_active ? '' : ' · Nonaktif'), load: byId.get(member.id) })),
    ...(stats ?? []).filter(item => !item.subject_id || !assigned.has(item.subject_id)).map(item => ({
      id: item.subject_id ?? 'unassigned', name: item.subject_id ? 'PIC tidak tersedia' : 'Belum ada PIC', initials: '–', role: 'Periksa penugasan', load: item,
    })),
  ];
  return (
    <section className="space-y-4" aria-label="Tim dan beban kerja">
      <header className="sa-surface flex items-start gap-3 p-4 sm:p-5">
        <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"><Users size={19} aria-hidden="true" /></span>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Tim &amp; beban kerja</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Tugas terlambat tampil lebih dulu. Angka mengikuti unit dan kampanye terpilih.</p>
        </div>
      </header>
      {loading && <p role="status" className="text-sm text-slate-500 dark:text-slate-400">Memuat tim dan target…</p>}
      {failed && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">Beban kerja belum dapat dimuat. Coba Segarkan.</p>}
      {!loading && !failed && !rows.length && <p className="sa-surface p-4 text-sm text-slate-500 dark:text-slate-400">Belum ada anggota atau tugas di lingkup ini.</p>}
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(row => {
          const load = row.load ?? (stats ? { subject_id:row.id, open_count:0, review_count:0, blocked_count:0, overdue_count:0, week_target:0, week_done:0 } : undefined);
          return (
            <li key={row.id} className="sa-surface flex min-w-0 flex-col gap-3 p-4">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">{row.initials}</span>
                <div className="min-w-0">
                  <h3 className="break-words font-bold text-slate-900 dark:text-slate-100">{row.name}</h3>
                  <p className="break-words text-xs text-slate-500 dark:text-slate-400">{row.role}</p>
                </div>
              </div>
              {load && <>
                <WeeklyProgress stats={load} />
                <dl className="grid grid-cols-3 gap-1 rounded-xl bg-slate-50/80 p-2.5 text-xs dark:bg-white/[0.04]">
                  <div><dt className="text-slate-500 dark:text-slate-400">Terbuka</dt><dd className="text-base font-bold text-slate-900 dark:text-slate-100">{load.open_count}</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">Review</dt><dd className="text-base font-bold text-slate-900 dark:text-slate-100">{load.review_count}</dd></div>
                  <div><dt className="text-slate-500 dark:text-slate-400">Terlambat</dt><dd className={'text-base font-bold '+(load.overdue_count ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100')}>{load.overdue_count}</dd></div>
                </dl>
                {load.blocked_count > 0 && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">{load.blocked_count} tugas terhambat</p>}
              </>}
              <button type="button" className={button + ' mt-auto flex items-center justify-between'} onClick={() => onSelect(row.id)}>Buka antrean <ArrowUpRight size={15} /></button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
