import { describe, expect, it } from 'vitest';
import { calendarMonth, jakartaToday, mondayWeek, shiftMonth } from './schedule';

describe('creative weekly planning in Jakarta', () => {
  it('rolls the week over at midnight Monday in WIB', () => {
    expect(mondayWeek(jakartaToday(new Date('2026-11-08T16:59:59Z')))).toEqual({
      monday: '2026-11-02', nextMonday: '2026-11-09',
    });
    expect(mondayWeek(jakartaToday(new Date('2026-11-08T17:00:00Z')))).toEqual({
      monday: '2026-11-09', nextMonday: '2026-11-16',
    });
  });

  it('supports a planning week that crosses the calendar year', () => {
    expect(mondayWeek('2027-01-01')).toEqual({ monday: '2026-12-28', nextMonday: '2027-01-04' });
  });
});

it('renders the entire month in Monday-first rows across a year boundary', () => {
  const { from, until, days } = calendarMonth('2026-12-31');
  expect([from, until, days[0], days.at(-1), days.length]).toEqual(['2026-12-01', '2027-01-01', '2026-11-30', '2027-01-03', 35]);
  expect(shiftMonth('2027-01-31', 1)).toBe('2027-02-01');
  expect(calendarMonth('2028-02-15').days).toContain('2028-02-29');
  expect(calendarMonth('2026-11-01').days).toHaveLength(42);
});
