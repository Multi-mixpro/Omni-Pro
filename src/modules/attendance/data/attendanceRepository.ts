// Repository: Central Attendance Data Access
// Interaksi Supabase terpusat untuk Single-Login, Employee Today, Event Capture, History & Admin Monitor

import { supabase } from '@/integrations/supabase/client';
import type {
  BusinessUnit,
  WorkLocation,
  Employee,
  AttendanceMembership,
  EmployeeSchedule,
  AttendanceEvent,
  AttendanceDay,
  LeaveRequest,
} from '../domain/types';
import { attendanceDateInJakarta } from '../domain/attendanceDate';

export interface AppError {
  code: string;
  message: string;
}

const scheduleEnsureInflight = new Map<string, Promise<void>>();

function mapError(error: unknown): AppError {
  if (error && typeof error === 'object' && 'message' in error) {
    const e = error as { message: string; code?: string };
    return { code: e.code ?? 'UNKNOWN_ERROR', message: e.message };
  }
  return { code: 'UNKNOWN_ERROR', message: 'Terjadi kesalahan tidak dikenal' };
}

/** Input pembuatan pengguna Attendance (akun login + karyawan sekaligus). */
export interface NewAttendanceUserInput {
  employee_no: string;
  pin: string;
  full_name: string;
  phone?: string;
  role: 'LOCATION_MANAGER' | 'SUPERVISOR' | 'EMPLOYEE' | 'AUDITOR';
  business_unit_id: string;
  location_id: string;
  job_title?: string;
}

export interface NewAttendanceUserResult {
  employee_id: string;
  user_id: string;
  employee_no: string;
  role: string;
  pin_configured: boolean;
}

/**
 * Buat pengguna Attendance lewat endpoint server.
 *
 * Akun yang dihasilkan hanya memperoleh attendance_memberships; tidak pernah
 * diberi user_roles, sehingga tidak bisa masuk Product Launch OS.
 */
export async function createAttendanceUser(
  input: NewAttendanceUserInput,
): Promise<NewAttendanceUserResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sesi tidak tersedia. Silakan masuk kembali.');

  const response = await fetch('/api/attendance-user-create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });

  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Pembuatan pengguna hanya tersedia pada deployment server, bukan Vite localhost.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Di dev server Vite, fungsi serverless tidak berjalan sehingga selalu 404.
    if (response.status === 404) {
      throw new Error('Pembuatan pengguna hanya tersedia pada deployment (Vercel), bukan di localhost.');
    }
    throw new Error(payload.error ?? 'Pengguna Attendance gagal dibuat.');
  }
  return payload as NewAttendanceUserResult;
}

export interface UpdateAttendanceUserInput {
  employee_id: string;
  employee_no: string;
  full_name: string;
  job_title?: string;
  pin?: string;
}

export async function updateAttendanceUser(input: UpdateAttendanceUserInput): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sesi tidak tersedia. Silakan masuk kembali.');

  const response = await fetch('/api/attendance-user-update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(input),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Pembaruan pengguna hanya tersedia pada deployment server, bukan Vite localhost.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Pembaruan pengguna hanya tersedia pada deployment server, bukan Vite localhost.');
    }
    throw new Error(payload.error ?? 'Pengguna Attendance gagal diperbarui.');
  }
}

export interface AttendanceFaceCapture {
  image_data_url: string;
  descriptor: number[];
  face_score: number;
  antispoof_score: number;
  liveness_score: number;
}

export async function enrollAttendanceFace(
  employeeId: string,
  capture: AttendanceFaceCapture,
): Promise<{ face_enrolled_at: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Sesi tidak tersedia. Silakan masuk kembali.');

  const response = await fetch('/api/attendance-face-enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ employee_id: employeeId, consent_confirmed: true, ...capture }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error ?? 'Pendaftaran wajah gagal.');
  if (payload.face_enrolled !== true || payload.employee_id !== employeeId) {
    throw new Error('Server belum mengonfirmasi pendaftaran wajah.');
  }
  return { face_enrolled_at: String(payload.face_enrolled_at) };
}

/** Scope organisasi/unit/lokasi milik seorang employee. */
export interface EmployeeScope {
  organization_id: string;
  business_unit_id: string;
  location_id: string;
}

export const attendanceRepository = {
  /**
   * Ambil scope dari assignment PRIMER employee (fallback: assignment aktif pertama).
   *
   * Sebelumnya beberapa layar memakai UUID nil sebagai fallback ketika unit tidak
   * ketemu. Kolom organization_id/business_unit_id punya foreign key, sehingga
   * insert pasti ditolak dan user hanya melihat error FK yang membingungkan.
   * Lebih baik gagal lebih awal dengan pesan yang bisa ditindaklanjuti.
   */
  async resolveEmployeeScope(
    employeeId: string,
  ): Promise<{ data: EmployeeScope | null; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_employee_assignments')
        .select('business_unit_id, location_id, is_primary, business_unit:attendance_business_units(organization_id)')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return { data: null, error: mapError(error) };
      if (!data) {
        return {
          data: null,
          error: {
            code: 'NO_ASSIGNMENT',
            message: 'Anda belum ditugaskan ke unit dan lokasi mana pun. Hubungi admin unit untuk pengaturan penempatan.',
          },
        };
      }

      const unit = data.business_unit as unknown as { organization_id?: string } | null;
      if (!unit?.organization_id) {
        return {
          data: null,
          error: {
            code: 'NO_ORGANIZATION',
            message: 'Unit penempatan Anda belum terhubung ke organisasi. Hubungi admin unit.',
          },
        };
      }

      return {
        data: {
          organization_id: unit.organization_id,
          business_unit_id: data.business_unit_id,
          location_id: data.location_id,
        },
      };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  // ===================================
  // 1. Single Login & Scope Context
  // ===================================
  async getMemberships(userId: string): Promise<{ data: AttendanceMembership[]; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_memberships')
        .select(`
          *,
          business_unit:attendance_business_units(*),
          location:attendance_locations(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) return { data: [], error: mapError(error) };
      return { data: (data ?? []) as unknown as AttendanceMembership[] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  async getEmployeeProfile(userId: string): Promise<{ data: Employee | null; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_employees')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) return { data: null, error: mapError(error) };
      return { data: data as Employee | null };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  async listEmployees(): Promise<{ data: Employee[]; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_employees')
        .select('*')
        .eq('is_active', true)
        .order('employee_no');

      if (error) return { data: [], error: mapError(error) };
      return { data: (data ?? []) as Employee[] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  async listEmployeesWithAssignments(): Promise<{ data: any[]; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_employees')
        .select(`
          *,
          assignments:attendance_employee_assignments(
            *,
            business_unit:attendance_business_units(*),
            location:attendance_locations(*)
          )
        `)
        .eq('is_active', true)
        .order('employee_no');

      if (error) {
        console.warn('[Attendance] listEmployeesWithAssignments error:', error);
        return { data: [], error: mapError(error) };
      }
      if (!data || data.length === 0) {
        console.warn('[Attendance] listEmployeesWithAssignments returned 0 rows — check RLS policies or data state.');
      }
      return { data: data ?? [] };
    } catch (err) {
      console.warn('[Attendance] listEmployeesWithAssignments exception:', err);
      return { data: [], error: mapError(err) };
    }
  },

  async deleteEmployee(id: string): Promise<{ data: boolean; error?: AppError }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return { data: false, error: { code: 'NO_SESSION', message: 'Sesi tidak tersedia. Silakan masuk kembali.' } };

      const response = await fetch('/api/attendance-user-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employee_id: id }),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        return { data: false, error: { code: 'SERVER_REQUIRED', message: 'Penghapusan karyawan membutuhkan server aplikasi.' } };
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { data: false, error: { code: String(response.status), message: payload.error ?? 'Karyawan gagal dihapus.' } };
      }
      if (payload.deactivated !== true || payload.id !== id) {
        return { data: false, error: { code: 'DELETE_NOT_CONFIRMED', message: 'Server belum mengonfirmasi perubahan status karyawan.' } };
      }
      return { data: true };
    } catch (err) {
      return { data: false, error: mapError(err) };
    }
  },

  async listShiftTemplates(unitId?: string): Promise<{ data: any[]; error?: AppError }> {
    try {
      let query = supabase.from('attendance_shift_templates').select('*, business_unit:attendance_business_units(*)').eq('is_active', true);
      if (unitId) query = query.eq('business_unit_id', unitId);
      const { data, error } = await query.order('start_time');
      if (error) return { data: [], error: mapError(error) };
      return { data: data ?? [] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  async createShiftTemplate(input: {
    business_unit_id: string;
    name: string;
    code: string;
    start_time: string;
    end_time: string;
    late_tolerance_mins?: number;
    break_duration_mins?: number;
  }): Promise<{ data: any; error?: AppError }> {
    try {
      const { data: org } = await supabase.from('attendance_organizations').select('id').limit(1).single();
      const { data, error } = await supabase
        .from('attendance_shift_templates')
        .insert({
          organization_id: org?.id ?? '00000000-0000-0000-0000-000000000000',
          business_unit_id: input.business_unit_id,
          name: input.name,
          code: input.code,
          start_time: input.start_time,
          end_time: input.end_time,
          late_tolerance_mins: input.late_tolerance_mins ?? 15,
          break_duration_mins: input.break_duration_mins ?? 60,
        })
        .select('*')
        .single();

      if (error) return { data: null, error: mapError(error) };
      return { data };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  async updateShiftTemplate(id: string, input: {
    name?: string;
    start_time?: string;
    end_time?: string;
    late_tolerance_mins?: number;
  }): Promise<{ data: boolean; error?: AppError }> {
    try {
      const { error } = await supabase.from('attendance_shift_templates').update(input).eq('id', id);
      if (error) return { data: false, error: mapError(error) };
      return { data: true };
    } catch (err) {
      return { data: false, error: mapError(err) };
    }
  },

  async deleteShiftTemplate(id: string): Promise<{ data: boolean; error?: AppError }> {
    try {
      // 1. Find all schedules that reference this shift template
      const { data: schedules } = await supabase
        .from('attendance_schedules')
        .select('id')
        .eq('shift_template_id', id);

      if (schedules && schedules.length > 0) {
        const scheduleIds = schedules.map(s => s.id);

        // 2. Delete attendance_days that reference these schedules
        //    (attendance_days.schedule_id → attendance_schedules.id)
        for (const sid of scheduleIds) {
          // First delete events linked through days
          const { data: daysForSchedule } = await supabase
            .from('attendance_days')
            .select('id, check_in_event_id, check_out_event_id')
            .eq('schedule_id', sid);

          if (daysForSchedule && daysForSchedule.length > 0) {
            // Collect event IDs to delete
            const eventIds = daysForSchedule
              .flatMap(d => [d.check_in_event_id, d.check_out_event_id])
              .filter(Boolean) as string[];

            // Nullify FK references in days before deleting events
            await supabase
              .from('attendance_days')
              .update({ check_in_event_id: null, check_out_event_id: null })
              .eq('schedule_id', sid);

            // Delete the days
            await supabase.from('attendance_days').delete().eq('schedule_id', sid);

            // Delete orphan events
            if (eventIds.length > 0) {
              await supabase.from('attendance_events').delete().in('id', eventIds);
            }
          }
        }

        // 3. Delete the schedules
        await supabase.from('attendance_schedules').delete().eq('shift_template_id', id);
      }

      // 4. Delete the shift template
      const { error } = await supabase.from('attendance_shift_templates').delete().eq('id', id);
      if (error) {
        // Fallback to soft-delete if hard delete still fails
        const { error: softErr } = await supabase
          .from('attendance_shift_templates')
          .update({ is_active: false })
          .eq('id', id);
        if (softErr) return { data: false, error: mapError(softErr) };
      }
      return { data: true };
    } catch (err) {
      return { data: false, error: mapError(err) };
    }
  },

  async listAuditLogs(): Promise<{ data: any[]; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) return { data: [], error: mapError(error) };
      return { data: data ?? [] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  async listBusinessUnits(): Promise<{ data: BusinessUnit[]; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_business_units')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) return { data: [], error: mapError(error) };
      return { data: (data ?? []) as BusinessUnit[] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  async listLocations(unitId?: string): Promise<{ data: WorkLocation[]; error?: AppError }> {
    try {
      let query = supabase.from('attendance_locations').select('*, business_unit:attendance_business_units(*)').eq('is_active', true);
      if (unitId) query = query.eq('business_unit_id', unitId);

      const { data, error } = await query.order('name');
      if (error) return { data: [], error: mapError(error) };
      return { data: (data ?? []) as unknown as WorkLocation[] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  // ===================================
  // 2. Schedule Auto-Provisioning & Today
  // ===================================
  async ensureDailySchedules(dateStr = attendanceDateInJakarta()): Promise<void> {
    const existing = scheduleEnsureInflight.get(dateStr);
    if (existing) return existing;

    const task = (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const response = await fetch('/api/attendance-schedules-ensure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: dateStr }),
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Penyiapan jadwal membutuhkan server aplikasi.');
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'Jadwal harian gagal disiapkan.');
      }
    })().catch((err) => {
      console.warn('Gagal menyiapkan jadwal otomatis:', err);
    }).finally(() => {
      scheduleEnsureInflight.delete(dateStr);
    });

    scheduleEnsureInflight.set(dateStr, task);
    return task;
  },

  async getTodaySchedule(employeeId: string, dateStr = attendanceDateInJakarta()): Promise<{ data: EmployeeSchedule | null; error?: AppError }> {
    try {
      await this.ensureDailySchedules(dateStr);

      const { data, error } = await supabase
        .from('attendance_schedules')
        .select(`
          *,
          shift_template:attendance_shift_templates(*),
          location:attendance_locations(*),
          business_unit:attendance_business_units(*)
        `)
        .eq('employee_id', employeeId)
        .eq('schedule_date', dateStr)
        .maybeSingle();

      if (error) return { data: null, error: mapError(error) };
      return { data: data as unknown as EmployeeSchedule | null };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  async getTodayAttendanceDay(employeeId: string, dateStr = attendanceDateInJakarta()): Promise<{ data: AttendanceDay | null; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_days')
        .select(`
          *,
          check_in_event:attendance_events!check_in_event_id(*),
          check_out_event:attendance_events!check_out_event_id(*)
        `)
        .eq('employee_id', employeeId)
        .eq('work_date', dateStr)
        .maybeSingle();

      if (error) return { data: null, error: mapError(error) };
      return { data: data as unknown as AttendanceDay | null };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  // ===================================
  // 3. Capture & Process Attendance Event
  // ===================================
  async recordAttendanceEvent(input: {
    employee_id: string;
    event_type: 'CHECK_IN' | 'CHECK_OUT';
    client_captured_at: string;
    latitude: number;
    longitude: number;
    accuracy_m: number;
    image_data_url: string;
    descriptor: number[];
    face_score: number;
    antispoof_score: number;
    liveness_score: number;
    device_id: string;
    idempotency_key: string;
  }): Promise<{ data: AttendanceEvent | null; error?: AppError }> {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return { data: null, error: { code: 'NO_SESSION', message: 'Sesi tidak tersedia. Silakan masuk kembali.' } };

      const response = await fetch('/api/attendance-event-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(input),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { data: null, error: { code: String(response.status), message: payload.error ?? 'Presensi gagal diproses.' } };
      }
      return { data: payload.event as AttendanceEvent };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  // ===================================
  // 4. Employee History & Leave
  // ===================================
  async getEmployeeHistory(employeeId: string, monthStr?: string): Promise<{ data: AttendanceDay[]; error?: AppError }> {
    try {
      let query = supabase
        .from('attendance_days')
        .select(`
          *,
          check_in_event:attendance_events!check_in_event_id(*),
          check_out_event:attendance_events!check_out_event_id(*)
        `)
        .eq('employee_id', employeeId);

      if (monthStr) {
        query = query.gte('work_date', `${monthStr}-01`).lte('work_date', `${monthStr}-31`);
      }

      const { data, error } = await query.order('work_date', { ascending: false });
      if (error) return { data: [], error: mapError(error) };
      return { data: (data ?? []) as unknown as AttendanceDay[] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  async requestLeave(input: {
    organization_id: string;
    business_unit_id: string;
    employee_id: string;
    leave_type: 'SICK' | 'ANNUAL_LEAVE' | 'PERMISSION' | 'BUSINESS_TRIP';
    start_date: string;
    end_date: string;
    reason: string;
  }): Promise<{ data: LeaveRequest | null; error?: AppError }> {
    try {
      const { data, error } = await supabase
        .from('attendance_leave_requests')
        .insert({
          organization_id: input.organization_id,
          business_unit_id: input.business_unit_id,
          employee_id: input.employee_id,
          leave_type: input.leave_type,
          start_date: input.start_date,
          end_date: input.end_date,
          reason: input.reason,
          status: 'PENDING',
        })
        .select('*')
        .single();

      if (error) return { data: null, error: mapError(error) };
      return { data: data as LeaveRequest };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  // ===================================
  // 5. Admin Monitoring & Multi-Unit Live Stats
  // ===================================
  async getLiveMonitorStats(unitId?: string, dateStr = attendanceDateInJakarta()): Promise<{
    data: {
      scheduled: number;
      present: number;
      late: number;
      absent: number;
      on_leave: number;
      days: AttendanceDay[];
    };
    error?: AppError;
  }> {
    try {
      // Pastikan jadwal & record harian sudah dibuat untuk hari ini
      await this.ensureDailySchedules(dateStr);

      let query = supabase
        .from('attendance_days')
        .select(`
          *,
          employee:attendance_employees(*),
          check_in_event:attendance_events!check_in_event_id(*),
          check_out_event:attendance_events!check_out_event_id(*)
        `)
        .eq('work_date', dateStr);

      if (unitId) query = query.eq('business_unit_id', unitId);

      const { data, error } = await query;
      if (error) return { data: { scheduled: 0, present: 0, late: 0, absent: 0, on_leave: 0, days: [] }, error: mapError(error) };

      // Jadwal lama tetap disimpan sebagai histori, tetapi karyawan yang sudah
      // dinonaktifkan tidak boleh lagi dihitung atau muncul di monitor aktif.
      const days = ((data ?? []) as unknown as AttendanceDay[])
        .filter(day => day.employee?.is_active === true);
      const present = days.filter(d => d.check_in_time || d.status === 'PRESENT').length;
      const late = days.filter(d => d.status === 'LATE').length;
      const on_leave = days.filter(d => d.status === 'ON_LEAVE').length;
      const absent = days.filter(d => d.status === 'ABSENT' && !d.check_in_time).length;

      return {
        data: {
          scheduled: days.length,
          present,
          late,
          absent,
          on_leave,
          days,
        },
      };
    } catch (err) {
      return { data: { scheduled: 0, present: 0, late: 0, absent: 0, on_leave: 0, days: [] }, error: mapError(err) };
    }
  },
};
