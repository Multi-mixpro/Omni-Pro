export type Focus = 'all' | 'week' | 'today' | 'overdue' | 'review' | 'ready' | 'blocked' | 'unplanned' | 'publish';

export const focusLabels: Record<Focus, string> = {
  all: 'Semua tugas', week: 'Target minggu ini', today: 'Deadline hari ini',
  overdue: 'Terlambat', review: 'Menunggu review', ready: 'Siap tayang', blocked: 'Terhambat', unplanned: 'Tanpa PIC / deadline', publish: 'Tayang minggu ini',
};

export function jakartaToday(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(now);
}

export function mondayWeek(today: string) {
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  const monday = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + 7);
  return { monday, nextMonday: date.toISOString().slice(0, 10) };
}

export function shiftDay(day: string, offset: number) {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function shiftMonth(day: string, offset: number) {
  const date = new Date(day.slice(0, 7) + '-01T00:00:00Z');
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().slice(0, 10);
}

export function calendarMonth(day: string) {
  const from = shiftMonth(day, 0);
  const until = shiftMonth(day, 1);
  const start = mondayWeek(from).monday;
  const last = shiftDay(until, -1);
  const end = mondayWeek(last).nextMonday;
  const days: string[] = [];
  for (let date = start; date < end; date = shiftDay(date, 1)) days.push(date);
  return { from, until, days };
}
