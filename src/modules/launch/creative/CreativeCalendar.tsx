import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { button, errorText, field, Options } from './CreativeForms';
import { eventKinds, monthEvents, type CalendarEvent } from './channelRepository';
import { platforms } from './repository';
import { calendarMonth, shiftMonth } from './schedule';

const monthFormat = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayFormat = new Intl.DateTimeFormat('id-ID', { dateStyle: 'full', timeZone: 'UTC' });
const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const dateOf = (date: string) => new Date(date + 'T00:00:00Z');

export function CreativeCalendar({ userId, unit, scope, today, selected, onSelect, onEvent, onOpenCalendar }: {
  userId: string; unit: string; scope: string; today: string; selected: string;
  onSelect: (day: string) => void; onEvent: (event: CalendarEvent) => void; onOpenCalendar?: () => void;
}) {
  const [kind, setKind] = useState('');
  const compact = Boolean(onOpenCalendar);
  const { from, until, days } = calendarMonth(selected);
  const query = useQuery({
    queryKey: ['creative', userId, 'calendar', unit, scope, from],
    queryFn: ({ signal }) => monthEvents(unit, scope, from, until, signal),
  });
  const byDay = new Map<string, CalendarEvent[]>();
  for (const event of query.data ?? []) {
    if (kind && event.kind !== kind) continue;
    const entries = byDay.get(event.event_day);
    if (entries) entries.push(event);
    else byDay.set(event.event_day, [event]);
  }
  const agenda = byDay.get(selected) ?? [];
  return <section className={'creative-calendar ' + (compact ? 'creative-calendar-compact' : 'creative-calendar-full')} aria-label={compact ? 'Kalender bulanan Pusat Kerja' : 'Kalender bulanan Creative'}>
    <div className="creative-calendar-heading">
      <div className="flex items-center gap-3"><span className="creative-color-icon" data-color="mint"><CalendarDays size={17} /></span>
        <div><p className="creative-eyebrow text-[10px] font-bold uppercase tracking-widest">Jadwal tim · WIB</p>
          <h2 className="text-lg font-bold">{compact ? 'Kalender tim' : 'Kalender Creative'}</h2></div></div>
      {onOpenCalendar && <button className={button + ' inline-flex items-center gap-1.5'} onClick={onOpenCalendar}>Buka kalender <ArrowUpRight size={15} /></button>}
    </div>
    <div className="creative-calendar-tools">
      <button className={button} aria-label="Bulan sebelumnya" onClick={() => onSelect(shiftMonth(selected, -1))}><ChevronLeft size={17} /></button>
      <h3 aria-live="polite" className="min-w-0 grow font-bold capitalize">{monthFormat.format(dateOf(from))}</h3>
      <button className={button} onClick={() => onSelect(today)}>Hari ini</button>
      <button className={button} aria-label="Bulan berikutnya" onClick={() => onSelect(shiftMonth(selected, 1))}><ChevronRight size={17} /></button>
      {!compact && <select className={field + ' sm:w-auto'} aria-label="Jenis jadwal" value={kind} onChange={event => setKind(event.target.value)}>
        <option value="">Semua jadwal</option><Options values={eventKinds} />
      </select>}
    </div>
    <div className="creative-calendar-grid">
      {weekdays.map(day => <span key={day} className="creative-calendar-weekday">{day}</span>)}
      {days.map(day => {
        const inside = day >= from && day < until;
        const entries = byDay.get(day) ?? [];
        const marks = [...new Set(entries.map(event => event.kind))];
        return inside ? <button type="button" key={day} className="creative-calendar-day" aria-pressed={day === selected}
          aria-current={day === today ? 'date' : undefined} aria-label={dayFormat.format(dateOf(day)) + (entries.length ? ', ' + entries.length + ' jadwal' : '')}
          onClick={() => onSelect(day)}>
          <span className="creative-calendar-number">{Number(day.slice(-2))}</span>
          <span className="creative-calendar-marks" aria-hidden="true">{marks.map(mark => <i key={mark} data-kind={mark} />)}</span>
          {!compact && <span className="creative-calendar-previews" aria-hidden="true">
            {entries.slice(0, 2).map(event => <span data-kind={event.kind} key={event.kind + event.item_id}>{event.title}</span>)}
            {entries.length > 2 && <small>+{entries.length - 2} lagi</small>}
          </span>}
        </button> : <span key={day} className="creative-calendar-blank" aria-hidden="true">{Number(day.slice(-2))}</span>;
      })}
    </div>
    <ul className="creative-calendar-legend" aria-label="Legenda jadwal">
      {Object.entries(eventKinds).filter(([key]) => !kind || key === kind).map(([key, label]) => <li key={key}><i data-kind={key} />{label}</li>)}
    </ul>
    <div className="creative-calendar-agenda">
      <h3 className="text-sm font-bold capitalize">{dayFormat.format(dateOf(selected))}</h3>
      {query.isPending && <p role="status" className="text-sm text-slate-600">Memuat jadwal…</p>}
      {query.isError && <p role="alert" className="text-sm text-rose-800">{errorText(query.error)}</p>}
      {query.isSuccess && !agenda.length && <p className="text-sm text-slate-600">Tidak ada jadwal pada tanggal ini.</p>}
      <ul className="grid gap-2">
        {agenda.map(event => <li key={event.kind + event.item_id}><button type="button" onClick={() => onEvent(event)}
          className="creative-calendar-event" data-kind={event.kind}>
          <span className="min-w-0"><strong className="block break-words text-sm">{event.title}</strong>
            <span className="block text-xs">{eventKinds[event.kind]} · {platforms[event.platform]}
              {selected < today && ((event.kind === 'deadline' && event.status !== 'done') || (event.kind === 'evaluation' && event.status !== 'evaluated')) ? ' · Terlambat' : ''}</span></span><ArrowUpRight size={15} className="shrink-0" />
        </button></li>)}
      </ul>
    </div>
  </section>;
}
