import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, CircleCheck, Clock3, Megaphone, Send } from 'lucide-react';
import { calendarEvents, eventKinds, type CalendarEvent } from './channelRepository';
import { errorText } from './CreativeForms';
import { mondayWeek, shiftDay } from './schedule';
import { platforms } from './repository';

const utcDate = (day: string) => new Date(day + 'T00:00:00Z');
const weekday = new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const month = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const style = {
  deadline: { icon: Clock3, color: 'bg-amber-100 text-amber-900' },
  publish: { icon: Send, color: 'bg-teal-100 text-teal-900' },
  published: { icon: CircleCheck, color: 'bg-emerald-100 text-emerald-900' },
  evaluation: { icon: Megaphone, color: 'bg-rose-100 text-rose-900' },
};
const PAGE = 6;

export function CreativeAgenda({ userId, unit, scope, today, onOpenCalendar, onEvent }: {
  userId: string; unit: string; scope: string; today: string;
  onOpenCalendar: (day: string) => void; onEvent: (event: CalendarEvent) => void;
}) {
  const [selected, setSelected] = useState(today);
  const from = mondayWeek(selected).monday;
  const days = Array.from({ length: 7 }, (_, index) => shiftDay(from, index));
  const query = useQuery({
    queryKey: ['creative',userId,'calendar','agenda',unit,scope,selected],
    queryFn: ({ signal }) => calendarEvents(unit,scope,selected,shiftDay(selected,1),0,'',signal,PAGE),
  });
  return <aside aria-label="Agenda kreatif" className="min-w-0 self-start overflow-hidden rounded-3xl border border-teal-100 bg-white shadow-sm xl:sticky xl:top-4">
    <div className="space-y-4 border-b border-teal-100 bg-teal-50/70 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div><p className="text-xs font-semibold uppercase tracking-wide text-teal-800">Jadwal tim · WIB</p><h2 className="text-lg font-bold text-slate-900">Agenda</h2></div>
        <CalendarDays size={21} className="text-teal-800" aria-hidden="true" />
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm font-bold capitalize">{month.format(utcDate(selected))}</p>
        <div className="flex gap-1">
          <button type="button" aria-label="Minggu sebelumnya" onClick={() => setSelected(shiftDay(selected,-7))} className="rounded-lg p-2 text-teal-900 hover:bg-teal-100"><ChevronLeft size={17} /></button>
          <button type="button" aria-label="Minggu berikutnya" onClick={() => setSelected(shiftDay(selected,7))} className="rounded-lg p-2 text-teal-900 hover:bg-teal-100"><ChevronRight size={17} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1" aria-label="Pilih tanggal">
        {days.map(day => <button type="button" key={day} onClick={() => setSelected(day)}
          aria-label={fullDate.format(utcDate(day))} aria-pressed={day === selected}
          className={'flex min-h-11 min-w-0 flex-col items-center justify-center rounded-xl px-0.5 py-1 text-xs ' +
            (day === selected ? 'bg-teal-800 text-white' : day === today ? 'bg-teal-100 text-teal-900' : 'text-slate-600 hover:bg-teal-100')}>
          <span>{weekday.format(utcDate(day))}</span><span className="font-bold">{Number(day.slice(-2))}</span>
        </button>)}
      </div>
    </div>
    <div className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-bold capitalize">{fullDate.format(utcDate(selected))}</h3>
        {selected !== today && <button type="button" className="text-xs font-semibold text-teal-800 underline" onClick={() => setSelected(today)}>Hari ini</button>}</div>
      {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat agenda…</p>}
      {query.isError && <p role="alert" className="text-sm text-rose-800">{errorText(query.error)}</p>}
      {query.isSuccess && !query.data.length && <p className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-600">Tidak ada jadwal pada tanggal ini.</p>}
      <ul className="space-y-2">
        {query.data?.slice(0,PAGE).map(event => {
          const { icon: Icon,color } = style[event.kind];
          return <li key={event.item_id+event.kind}><button type="button" onClick={() => onEvent(event)}
            className="flex w-full min-w-0 items-start gap-2 rounded-xl border border-slate-100 p-2 text-left hover:border-teal-300 hover:bg-teal-50/40">
            <span className={'shrink-0 rounded-lg p-2 '+color}><Icon size={15} aria-hidden="true" /></span>
            <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold">{event.title}</span>
              <span className="block text-xs text-slate-600">{eventKinds[event.kind]} · {platforms[event.platform]}</span></span>
          </button></li>;
        })}
      </ul>
      <button type="button" className="flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-teal-900 hover:bg-teal-100"
        onClick={() => onOpenCalendar(selected)}>{(query.data?.length ?? 0)>PAGE ? 'Lihat jadwal lainnya' : 'Buka kalender'} <ArrowUpRight size={16} /></button>
    </div>
  </aside>;
}
