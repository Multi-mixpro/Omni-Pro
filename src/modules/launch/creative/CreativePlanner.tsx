import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { button, errorText, field, Options } from './CreativeForms';
import { calendarEvents, channelStatus, eventKinds, type CalendarEvent } from './channelRepository';
import { PAGE_SIZE, platforms, taskStatuses } from './repository';
import { mondayWeek, shiftDay } from './schedule';

const dateFormat = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const label = (date: string) => dateFormat.format(new Date(date + 'T00:00:00Z'));
export function CreativePlanner({ userId, unit, scope, today, initialDay, onEvent }: {
  userId: string; unit: string; scope: string; today: string; initialDay?: string;
  onEvent: (event: CalendarEvent) => void;
}) {
  const [week, setWeek] = useState(() => initialDay
    ? Math.round((Date.parse(mondayWeek(initialDay).monday)-Date.parse(mondayWeek(today).monday))/604800000) : 0);
  const [page, setPage] = useState(0);
  const [kind, setKind] = useState('');
  const [view,setView] = useState<'week' | 'day'>(initialDay ? 'day' : 'week');
  const [day,setDay] = useState(initialDay ?? today);
  const weekStart = shiftDay(mondayWeek(today).monday,7*week);
  const from = view === 'day' ? day : weekStart;
  const until = shiftDay(from, view === 'day' ? 1 : 7);
  const query = useQuery({
    queryKey: ['creative', userId, 'calendar', unit, scope, from, page, kind],
    queryFn: ({ signal }) => calendarEvents(unit, scope, from, until, page, kind, signal),
  });
  const rows = query.data?.slice(0, PAGE_SIZE) ?? [];
  const days = Array.from({ length: view === 'day' ? 1 : 7 }, (_, index) => shiftDay(from, index));
  const movePeriod = (offset: number) => { if(view === 'day')setDay(shiftDay(day,offset));else setWeek(week+offset); setPage(0); };
  const resetPeriod = () => { setWeek(0);setDay(today);setPage(0); };
  return <section className="space-y-4 rounded-3xl border border-teal-100 bg-white p-4 shadow-sm sm:p-5" aria-label="Kalender kreatif">
    <div><h2 className="text-lg font-bold">Kalender &amp; Deadline</h2><p className="text-sm text-slate-600">Deadline produksi, jadwal tayang, dan batas evaluasi kanal dalam satu minggu WIB.</p></div>
    <div className="flex flex-wrap items-center gap-2">
      <button className={button} aria-pressed={view==='week'} onClick={() => { setView('week');setPage(0); }}>Minggu</button>
      <button className={button} aria-pressed={view==='day'} onClick={() => { setDay(week===0?today:weekStart);setView('day');setPage(0); }}>Agenda hari</button>
      <button className={button} onClick={() => movePeriod(-1)}>Sebelumnya</button>
      <button className={button} onClick={resetPeriod}>{view==='day'?'Hari ini':'Minggu ini'}</button>
      <button className={button} onClick={() => movePeriod(1)}>Berikutnya</button>
      <strong className="text-sm">{label(from)}{view==='week' ? ' – '+label(shiftDay(from,6)) : ''}</strong>
      <select className={field + ' sm:w-auto'} aria-label="Jenis jadwal" value={kind} onChange={event => { setKind(event.target.value); setPage(0); }}>
        <option value="">Semua jadwal</option><Options values={eventKinds} />
      </select>
    </div>
    {query.isPending && <p role="status" className="text-sm">Memuat kalender…</p>}
    {query.isError && <p role="alert" className="text-sm text-red-700">{errorText(query.error)}</p>}
    {query.isSuccess && <div className={'grid gap-2 '+(view==='week' ? 'sm:grid-cols-2 xl:grid-cols-7' : '')}>
      {days.map(day => <section key={day} className={'min-w-0 rounded-lg border p-2 ' + (day === today ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50')}>
        <h3 className="mb-2 text-xs font-bold">{label(day)}{day === today ? ' · Hari ini' : ''}</h3>
        <ul className="space-y-2">
          {rows.filter(row => row.event_day === day).map(row => {
            const overdue = day < today && (row.kind === 'deadline' && row.status !== 'done' || row.kind === 'evaluation' && row.status !== 'evaluated');
            return <li key={row.item_id + row.kind}><button type="button" onClick={() => onEvent(row)}
              className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-left hover:border-teal-400">
              <span className={'block text-xs font-bold ' + (overdue ? 'text-rose-800' : 'text-teal-800')}>{eventKinds[row.kind]}{overdue ? ' · Terlambat' : ''}</span>
              <span className="block break-words text-sm font-semibold">{row.title}</span>
              <span className="block text-xs text-slate-600">{platforms[row.platform]} · {row.kind === 'evaluation' ? channelStatus[row.status as keyof typeof channelStatus] : taskStatuses[row.status as keyof typeof taskStatuses]}</span>
            </button></li>;
          })}
        </ul>
        {!rows.some(row => row.event_day === day) && <p className="text-xs text-slate-500">Tidak ada di halaman ini</p>}
      </section>)}
    </div>}
    {(page > 0 || (query.data?.length ?? 0) > PAGE_SIZE) && <div className="flex flex-wrap items-center gap-2">
      <button className={button} disabled={!page} onClick={() => setPage(page - 1)}>Halaman sebelumnya</button><span className="text-sm">Halaman {page + 1}</span>
      <button className={button} disabled={(query.data?.length ?? 0) <= PAGE_SIZE} onClick={() => setPage(page + 1)}>Halaman berikutnya</button>
    </div>}
  </section>;
}
