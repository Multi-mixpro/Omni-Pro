import { describe, it, expect } from 'vitest';
import { parseTimeToMinutes, evaluateShiftStatus } from './shiftCalculator';

describe('shiftCalculator', () => {
  it('parses time string to minutes correctly', () => {
    expect(parseTimeToMinutes('03:00')).toBe(180);
    expect(parseTimeToMinutes('09:30')).toBe(570);
    expect(parseTimeToMinutes('22:00:00')).toBe(1320);
  });

  it('evaluates PRESENT for on-time check-in and check-out', () => {
    const res = evaluateShiftStatus({
      startTimeStr: '09:00',
      endTimeStr: '21:00',
      isCrossDay: false,
      lateToleranceMins: 15,
      earlyLeaveToleranceMins: 15,
      actualCheckInTime: new Date('2026-08-01T08:58:00'),
      actualCheckOutTime: new Date('2026-08-01T21:05:00'),
      scheduleDateStr: '2026-08-01',
    });

    expect(res.status).toBe('PRESENT');
    expect(res.late_mins).toBe(0);
    expect(res.early_leave_mins).toBe(0);
    expect(res.work_duration_mins).toBe(727); // 12h 7m
  });

  it('evaluates LATE when check-in exceeds tolerance', () => {
    const res = evaluateShiftStatus({
      startTimeStr: '03:00',
      endTimeStr: '15:00',
      isCrossDay: false,
      lateToleranceMins: 15,
      earlyLeaveToleranceMins: 15,
      actualCheckInTime: new Date('2026-08-01T03:25:00'), // 25 mins late
      actualCheckOutTime: new Date('2026-08-01T15:00:00'),
      scheduleDateStr: '2026-08-01',
    });

    expect(res.status).toBe('LATE');
    expect(res.late_mins).toBe(25);
  });

  it('handles cross-day shift (night shift)', () => {
    const res = evaluateShiftStatus({
      startTimeStr: '22:00',
      endTimeStr: '06:00',
      isCrossDay: true,
      lateToleranceMins: 15,
      earlyLeaveToleranceMins: 15,
      actualCheckInTime: new Date('2026-08-01T21:55:00'),
      actualCheckOutTime: new Date('2026-08-02T06:00:00'),
      scheduleDateStr: '2026-08-01',
    });

    expect(res.status).toBe('PRESENT');
    expect(res.work_duration_mins).toBe(485); // 8h 5m
  });
});
