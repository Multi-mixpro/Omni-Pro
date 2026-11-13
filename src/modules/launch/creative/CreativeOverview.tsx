import { ArrowRight, CalendarClock, CircleAlert, ClipboardCheck, Flag, ListTodo } from 'lucide-react';
import type { summary } from './repository';
import type { Focus } from './schedule';

export function CreativeOverview({ counts, period, onFocus }: {
  counts: Awaited<ReturnType<typeof summary>>; period: string; onFocus: (focus: Focus) => void;
}) {
  const metrics = [
    { focus: 'overdue', label: 'Terlambat', count: counts.overdue, icon: CalendarClock, color: 'coral' },
    { focus: 'review', label: 'Menunggu review', count: counts.review, icon: ClipboardCheck, color: 'blue' },
    { focus: 'blocked', label: 'Terhambat', count: counts.blocked, icon: CircleAlert, color: 'yellow' },
    { focus: 'unplanned', label: 'Tanpa PIC / deadline', count: counts.unplanned, icon: ListTodo, color: 'mint' },
  ] as const;
  const percent = counts.target ? Math.round(100 * counts.closed / counts.target) : 0;
  return <div className="space-y-4">
    <section className="creative-weekly-hero relative overflow-hidden space-y-4 rounded-[28px] p-5 text-white shadow-[0_18px_40px_-12px_rgba(20,99,255,0.35)] sm:p-6" aria-label="Target minggu ini">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-bold text-blue-100">
          <span className="grid h-7 w-7 place-items-center rounded-xl bg-white/15"><Flag size={15} /></span>
          <span>Target tim minggu ini</span>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-bold text-white backdrop-blur-xs">{percent}% tercapai</span>
      </div>
      <p className="text-xs font-medium text-blue-100/80">{period} · WIB</p>
      <p className="flex items-baseline gap-2">
        <strong className="font-mono text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">{counts.closed}</strong>
        <span className="font-mono text-xl font-semibold text-blue-200/80">/ {counts.target}</span>
        <span className="text-sm font-medium text-blue-100">tugas selesai</span>
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuenow={percent} aria-label="Persentase target mingguan">
        <div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-emerald-300 transition-all duration-500" style={{width:percent+'%'}} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-white">
        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-xs">{counts.on_time} tepat waktu</span>
        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-xs">{counts.target-counts.closed} masih terbuka</span>
        <span className="rounded-full bg-white/15 px-3 py-1 backdrop-blur-xs">{counts.published_week} publikasi aktual</span>
      </div>
      {!counts.target && <p className="text-sm text-blue-100">Belum ada tugas dengan deadline minggu ini.</p>}
      <button onClick={() => onFocus('week')} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-900 shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]">
        Lihat tugas minggu ini <ArrowRight size={15} />
      </button>
    </section>
    <section className="space-y-3.5 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-[#131926] sm:p-6" aria-label="Perlu ditindak">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">Perlu ditindak</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Ringkasan prioritas semua PIC pada unit &amp; kampanye terpilih.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {counts.done}/{counts.total} total selesai
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map(({ focus, label, count, icon: Icon, color }) => <button key={focus} onClick={() => onFocus(focus)} data-tone={color}
          className="creative-focus-card group flex min-w-0 flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]">
          <div className="flex w-full items-center justify-between">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/80 shadow-2xs dark:bg-slate-900/60"><Icon size={17} /></span>
            <ArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-75" />
          </div>
          <span className="font-mono text-2xl font-extrabold tabular-nums">{count}</span>
          <span className="text-xs font-bold leading-snug opacity-90">{label}</span>
        </button>)}
      </div>
    </section>
  </div>;
}
