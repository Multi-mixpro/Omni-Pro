import { describe, expect, it } from 'vitest';
import { attendanceDateInJakarta } from './attendanceDate';

describe('attendanceDateInJakarta', () => {
  it('uses the Jakarta work date before UTC midnight', () => {
    expect(attendanceDateInJakarta(new Date('2026-08-01T18:30:00.000Z'))).toBe('2026-08-02');
  });

  it('keeps the prior Jakarta date before 07:00 UTC', () => {
    expect(attendanceDateInJakarta(new Date('2026-08-02T00:30:00.000Z'))).toBe('2026-08-02');
  });
});
