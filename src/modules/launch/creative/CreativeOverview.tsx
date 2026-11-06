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
  return <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
    <section className="space-y-4 rounded-2xl bg-slate-900 p-5 text-white sm:p-6" aria-label="Target minggu ini">
      <div className="flex items-center gap-2 text-sm font-semibold text-teal-200"><Flag size={16} /> Target tim minggu ini</div>
      <p className="text-xs text-slate-300">{period} · WIB</p>
      <p><strong className="text-4xl font-bold tabular-nums">{counts.closed}</strong><span className="text-xl text-slate-300"> / {counts.target}</span> <span className="text-sm text-slate-200">tugas selesai</span></p>
      <div className="flex items-center gap-3"><progress className="h-2 min-w-0 flex-1 accent-teal-400" value={percent} max={100} aria-label="Persentase target mingguan" /><span className="text-sm tabular-nums">{percent}%</span></div>
      <p className="text-sm text-slate-300">{counts.target ? `${counts.on_time} tepat waktu · ${counts.target - counts.closed} masih terbuka` : 'Belum ada tugas dengan deadline minggu ini.'}</p>
      <p className="text-sm text-teal-200"><strong>{counts.published_week}</strong> publikasi aktual tercatat minggu ini</p>
      <button onClick={() => onFocus('week')} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20">Lihat tugas minggu ini <ArrowRight size={15} /></button>
    </section>
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5" aria-label="Perlu ditindak">
      <h2 className="font-bold">Perlu ditindak</h2>
      <p className="text-sm text-slate-600">Semua PIC pada unit dan kampanye terpilih.</p>
      <div className="grid grid-cols-2 gap-2">
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
