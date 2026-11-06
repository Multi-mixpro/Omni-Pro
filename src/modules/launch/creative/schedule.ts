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
