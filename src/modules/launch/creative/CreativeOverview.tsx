import { ArrowRight, CalendarClock, CircleAlert, ClipboardCheck, Flag, ListTodo } from 'lucide-react';
import type { summary } from './repository';
import type { Focus } from './schedule';

export function CreativeOverview({ counts, period, onFocus }: {
  counts: Awaited<ReturnType<typeof summary>>; period: string; onFocus: (focus: Focus) => void;
}) {
  const metrics = [
    { focus: 'overdue', label: 'Terlambat', count: counts.overdue, icon: CalendarClock, color: 'text-rose-800 bg-rose-50' },
    { focus: 'review', label: 'Menunggu review', count: counts.review, icon: ClipboardCheck, color: 'text-indigo-800 bg-indigo-50' },
    { focus: 'blocked', label: 'Terhambat', count: counts.blocked, icon: CircleAlert, color: 'text-amber-800 bg-amber-50' },
    { focus: 'unplanned', label: 'Tanpa PIC / deadline', count: counts.unplanned, icon: ListTodo, color: 'text-slate-800 bg-slate-100' },
  ] as const;
  const percent = counts.target ? Math.round(100 * counts.closed / counts.target) : 0;
  return <div className="space-y-3">
    <section className="creative-weekly-hero space-y-4 rounded-3xl bg-gradient-to-br from-teal-950 to-teal-800 p-5 text-white shadow-sm sm:p-6" aria-label="Target minggu ini">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-teal-100"><Flag size={16} /> Target tim minggu ini</div>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-teal-50">{percent}% tercapai</span>
      </div>
      <p className="text-xs text-slate-300">{period} · WIB</p>
      <p><strong className="text-4xl font-bold tabular-nums">{counts.closed}</strong><span className="text-xl text-slate-300"> / {counts.target}</span> <span className="text-sm text-slate-200">tugas selesai</span></p>
      <div className="h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={percent} aria-label="Persentase target mingguan">
        <div className="h-full rounded-full bg-teal-300" style={{width:percent+'%'}} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-teal-50">
        <span className="rounded-full bg-white/10 px-2.5 py-1">{counts.on_time} tepat waktu</span>
        <span className="rounded-full bg-white/10 px-2.5 py-1">{counts.target-counts.closed} masih terbuka</span>
        <span className="rounded-full bg-white/10 px-2.5 py-1">{counts.published_week} publikasi aktual</span>
      </div>
      {!counts.target && <p className="text-sm text-teal-100">Belum ada tugas dengan deadline minggu ini.</p>}
      <button onClick={() => onFocus('week')} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">Lihat tugas minggu ini <ArrowRight size={15} /></button>
    </section>
    <section className="space-y-3 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm sm:p-5" aria-label="Perlu ditindak">
      <h2 className="font-bold">Perlu ditindak</h2>
      <p className="text-sm text-slate-600">Semua PIC pada unit dan kampanye terpilih.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map(({ focus, label, count, icon: Icon, color }) => <button key={focus} onClick={() => onFocus(focus)}
          className="flex min-w-0 flex-col items-start gap-1 rounded-xl border border-slate-200 p-3 text-left hover:border-teal-500">
          <span className={'rounded-lg p-1.5 ' + color}><Icon size={16} /></span>
          <span className="text-xl font-bold tabular-nums">{count}</span>
          <span className="text-xs font-medium text-slate-700">{label}</span>
        </button>)}
      </div>
      <p className="text-xs text-slate-600">{counts.done} dari {counts.total} tugas selesai di seluruh periode.</p>
    </section>
  </div>;
}
