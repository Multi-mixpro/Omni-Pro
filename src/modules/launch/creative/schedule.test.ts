import { describe, expect, it } from 'vitest';
import { jakartaToday, mondayWeek } from './schedule';

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
