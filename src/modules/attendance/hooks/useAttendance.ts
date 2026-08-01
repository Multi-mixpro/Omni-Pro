// TanStack Query Hooks: Central Attendance Multi-Unit

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceRepository } from '../data/attendanceRepository';

export const attendanceKeys = {
  memberships: (userId: string) => ['attendance-memberships', userId] as const,
  profile: (userId: string) => ['attendance-employee-profile', userId] as const,
  units: () => ['attendance-units'] as const,
  locations: (unitId?: string) => ['attendance-locations', unitId] as const,
  todaySchedule: (empId: string, date: string) => ['attendance-today-sched', empId, date] as const,
  todayDay: (empId: string, date: string) => ['attendance-today-day', empId, date] as const,
  history: (empId: string, month?: string) => ['attendance-history', empId, month] as const,
  monitor: (unitId?: string, date?: string) => ['attendance-monitor', unitId, date] as const,
};

export function useAttendanceMemberships(userId: string | null) {
  return useQuery({
    queryKey: attendanceKeys.memberships(userId ?? ''),
    queryFn: () => attendanceRepository.getMemberships(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useEmployeeProfile(userId: string | null) {
  return useQuery({
    queryKey: attendanceKeys.profile(userId ?? ''),
    queryFn: () => attendanceRepository.getEmployeeProfile(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAttendanceUnits() {
  return useQuery({
    queryKey: attendanceKeys.units(),
    queryFn: () => attendanceRepository.listBusinessUnits(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useAttendanceLocations(unitId?: string) {
  return useQuery({
    queryKey: attendanceKeys.locations(unitId),
    queryFn: () => attendanceRepository.listLocations(unitId),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTodaySchedule(employeeId: string | null, dateStr: string) {
  return useQuery({
    queryKey: attendanceKeys.todaySchedule(employeeId ?? '', dateStr),
    queryFn: () => attendanceRepository.getTodaySchedule(employeeId!, dateStr),
    enabled: !!employeeId,
    staleTime: 1000 * 30,
  });
}

export function useTodayAttendanceDay(employeeId: string | null, dateStr: string) {
  return useQuery({
    queryKey: attendanceKeys.todayDay(employeeId ?? '', dateStr),
    queryFn: () => attendanceRepository.getTodayAttendanceDay(employeeId!, dateStr),
    enabled: !!employeeId,
    staleTime: 1000 * 15,
  });
}

export function useRecordAttendanceEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof attendanceRepository.recordAttendanceEvent>[0]) =>
      attendanceRepository.recordAttendanceEvent(vars),
    onSuccess: (_data, vars) => {
      const dateStr = new Date().toISOString().split('T')[0];
      queryClient.invalidateQueries({ queryKey: attendanceKeys.todayDay(vars.employee_id, dateStr) });
      queryClient.invalidateQueries({ queryKey: attendanceKeys.history(vars.employee_id) });
      queryClient.invalidateQueries({ queryKey: ['attendance-monitor'] });
    },
  });
}

export function useEmployeeHistory(employeeId: string | null, monthStr?: string) {
  return useQuery({
    queryKey: attendanceKeys.history(employeeId ?? '', monthStr),
    queryFn: () => attendanceRepository.getEmployeeHistory(employeeId!, monthStr),
    enabled: !!employeeId,
    staleTime: 1000 * 30,
  });
}

export function useRequestLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: Parameters<typeof attendanceRepository.requestLeave>[0]) =>
      attendanceRepository.requestLeave(vars),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.history(vars.employee_id) });
    },
  });
}

export function useLiveMonitorStats(unitId?: string, dateStr?: string) {
  return useQuery({
    queryKey: attendanceKeys.monitor(unitId, dateStr),
    queryFn: () => attendanceRepository.getLiveMonitorStats(unitId, dateStr),
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 15,
  });
}
