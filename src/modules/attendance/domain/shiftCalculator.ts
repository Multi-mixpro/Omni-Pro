// Shift Calculator: Pure Functions
// Menentukan keterlambatan, pulang cepat, durasi kerja, serta shift lintas tengah malam

import type { DayStatus } from './types';

export interface ShiftEvaluationResult {
  late_mins: number;
  early_leave_mins: number;
  work_duration_mins: number;
  status: DayStatus;
}

/**
 * Parses "HH:mm" or "HH:mm:ss" into minutes from midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + (parts[1] || 0);
}

/**
 * Evaluates shift timing for a check-in and check-out event
 */
export function evaluateShiftStatus(input: {
  startTimeStr: string;
  endTimeStr: string;
  isCrossDay: boolean;
  lateToleranceMins: number;
  earlyLeaveToleranceMins: number;
  actualCheckInTime: Date | null;
  actualCheckOutTime: Date | null;
  scheduleDateStr: string;
}): ShiftEvaluationResult {
  if (!input.actualCheckInTime) {
    return {
      late_mins: 0,
      early_leave_mins: 0,
      work_duration_mins: 0,
      status: 'ABSENT',
    };
  }

  // Target start Date
  const [sHour, sMin] = input.startTimeStr.split(':').map(Number);
  const targetStart = new Date(`${input.scheduleDateStr}T00:00:00`);
  targetStart.setHours(sHour, sMin, 0, 0);

  // Target end Date
  const [eHour, eMin] = input.endTimeStr.split(':').map(Number);
  const targetEnd = new Date(`${input.scheduleDateStr}T00:00:00`);
  if (input.isCrossDay || eHour < sHour) {
    targetEnd.setDate(targetEnd.getDate() + 1);
  }
  targetEnd.setHours(eHour, eMin, 0, 0);

  // Calculate late minutes
  const lateMs = input.actualCheckInTime.getTime() - targetStart.getTime();
  const lateDiffMins = Math.floor(lateMs / 60000);
  const late_mins = lateDiffMins > input.lateToleranceMins ? lateDiffMins : 0;

  // Calculate early leave minutes
  let early_leave_mins = 0;
  if (input.actualCheckOutTime) {
    const earlyMs = targetEnd.getTime() - input.actualCheckOutTime.getTime();
    const earlyDiffMins = Math.floor(earlyMs / 60000);
    if (earlyDiffMins > input.earlyLeaveToleranceMins) {
      early_leave_mins = earlyDiffMins;
    }
  }

  // Calculate work duration
  let work_duration_mins = 0;
  if (input.actualCheckOutTime) {
    const durMs = input.actualCheckOutTime.getTime() - input.actualCheckInTime.getTime();
    work_duration_mins = Math.max(0, Math.floor(durMs / 60000));
  }

  // Determine overall status
  let status: DayStatus = 'PRESENT';
  if (late_mins > 0 && early_leave_mins > 0) {
    status = 'LATE';
  } else if (late_mins > 0) {
    status = 'LATE';
  } else if (early_leave_mins > 0) {
    status = 'EARLY_LEAVE';
  }

  return {
    late_mins,
    early_leave_mins,
    work_duration_mins,
    status,
  };
}
