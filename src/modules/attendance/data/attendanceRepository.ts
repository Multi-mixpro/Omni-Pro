// Repository: Central Attendance Data Access
// Interaksi Supabase terpusat untuk Single-Login, Employee Today, Event Capture, History & Admin Monitor

import { supabase } from '@/integrations/supabase/client';
import { evaluateGeofence } from '../domain/geofenceCalculator';
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

export interface AppError {
  code: string;
  message: string;
}

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
        .order('employee_no');

      if (error) return { data: [], error: mapError(error) };
      return { data: data ?? [] };
    } catch (err) {
      return { data: [], error: mapError(err) };
    }
  },

  async deleteEmployee(id: string): Promise<{ data: boolean; error?: AppError }> {
    try {
      // Clean up dependent foreign keys first to prevent PostgreSQL 23503 error
      await supabase.from('attendance_employee_assignments').delete().eq('employee_id', id);
      await supabase.from('attendance_schedules').delete().eq('employee_id', id);
      await supabase.from('attendance_days').delete().eq('employee_id', id);
      await supabase.from('attendance_events').delete().eq('employee_id', id);

      const { error } = await supabase.from('attendance_employees').delete().eq('id', id);
      if (error) {
        // Fallback: Soft-delete setting is_active = false
        const { error: softErr } = await supabase.from('attendance_employees').update({ is_active: false }).eq('id', id);
        if (softErr) return { data: false, error: mapError(softErr) };
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
      await supabase.from('attendance_schedules').delete().eq('shift_template_id', id);

      const { error } = await supabase.from('attendance_shift_templates').delete().eq('id', id);
      if (error) {
        const { error: softErr } = await supabase.from('attendance_shift_templates').update({ is_active: false }).eq('id', id);
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
  async ensureDailySchedules(dateStr = new Date().toISOString().split('T')[0]): Promise<void> {
    try {
      // 1. Ambil seluruh pegawai aktif beserta assignment & unit-nya
      const { data: assignments } = await supabase
        .from('attendance_employee_assignments')
        .select(`
          *,
          employee:attendance_employees(*),
          business_unit:attendance_business_units(*),
          location:attendance_locations(*)
        `)
        .eq('is_active', true);

      if (!assignments || assignments.length === 0) return;

      // 2. Ambil shift templates yang ada
      const { data: templates } = await supabase
        .from('attendance_shift_templates')
        .select('*')
        .eq('is_active', true);

      // 3. Cek jadwal yang sudah ada untuk hari ini
      const { data: existingSchedules } = await supabase
        .from('attendance_schedules')
        .select('employee_id')
        .eq('schedule_date', dateStr);

      const scheduledEmpIds = new Set((existingSchedules ?? []).map(s => s.employee_id));

      // 4. Generate schedule untuk pegawai yang belum punya jadwal hari ini
      for (const assign of assignments) {
        if (scheduledEmpIds.has(assign.employee_id)) continue;

        // Pilih template shift yang sesuai
        const unitTemplates = (templates ?? []).filter(t => t.business_unit_id === assign.business_unit_id);
        let selectedTemplate = unitTemplates[0];

        const empNo = assign.employee?.employee_no;
        if (empNo === 'UJO-001') {
          selectedTemplate = unitTemplates.find(t => t.code === 'SHIFT_PROD_DINI') ?? selectedTemplate;
        } else if (empNo === 'UJO-002') {
          selectedTemplate = unitTemplates.find(t => t.code === 'SHIFT_PROD_PAGI_A') ?? selectedTemplate;
        } else if (empNo === 'UJO-003') {
          selectedTemplate = unitTemplates.find(t => t.code === 'SHIFT_PREP_SERVICE') ?? selectedTemplate;
        } else if (empNo === 'UJO-004' || empNo === 'UJO-005') {
          selectedTemplate = unitTemplates.find(t => t.code === 'SHIFT_OUTLET_CLOSE') ?? selectedTemplate;
        }

        if (!selectedTemplate) continue;

        // Insert schedule
        const { data: newSched } = await supabase
          .from('attendance_schedules')
          .insert({
            employee_id: assign.employee_id,
            assignment_id: assign.id,
            business_unit_id: assign.business_unit_id,
            location_id: assign.location_id,
            work_area_id: assign.primary_work_area_id,
            shift_template_id: selectedTemplate.id,
            schedule_date: dateStr,
            is_off: false,
          })
          .select('id')
          .single();

        // Insert initial attendance_days record (status ABSENT)
        const { data: existingDay } = await supabase
          .from('attendance_days')
          .select('id')
          .eq('employee_id', assign.employee_id)
          .eq('work_date', dateStr)
          .maybeSingle();

        if (!existingDay) {
          const { data: org } = await supabase.from('attendance_organizations').select('id').limit(1).single();

          await supabase.from('attendance_days').insert({
            organization_id: org?.id ?? assign.employee?.organization_id,
            business_unit_id: assign.business_unit_id,
            location_id: assign.location_id,
            employee_id: assign.employee_id,
            schedule_id: newSched?.id ?? null,
            work_date: dateStr,
            status: 'ABSENT',
          });
        }
      }
    } catch (err) {
      console.warn('Gagal men-generate schedule otomatis:', err);
    }
  },

  async getTodaySchedule(employeeId: string, dateStr = new Date().toISOString().split('T')[0]): Promise<{ data: EmployeeSchedule | null; error?: AppError }> {
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

  async getTodayAttendanceDay(employeeId: string, dateStr = new Date().toISOString().split('T')[0]): Promise<{ data: AttendanceDay | null; error?: AppError }> {
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
    organization_id: string;
    business_unit_id: string;
    location_id: string;
    work_area_id?: string;
    employee_id: string;
    assignment_id: string;
    schedule_id?: string;
    event_type: 'CHECK_IN' | 'CHECK_OUT';
    client_captured_at: string;
    latitude: number;
    longitude: number;
    accuracy_m: number;
    target_latitude: number;
    target_longitude: number;
    geofence_radius_m: number;
    photo_url?: string;
  }): Promise<{ data: AttendanceEvent | null; error?: AppError }> {
    try {
      const geo = evaluateGeofence(
        input.latitude,
        input.longitude,
        input.accuracy_m,
        input.target_latitude,
        input.target_longitude,
        input.geofence_radius_m
      );

      const dateStr = new Date().toISOString().split('T')[0];
      const idempotencyKey = `${input.employee_id}_${input.event_type}_${dateStr}_${Date.now()}`;

      const { data, error } = await supabase
        .from('attendance_events')
        .insert({
          organization_id: input.organization_id,
          business_unit_id: input.business_unit_id,
          location_id: input.location_id,
          work_area_id: input.work_area_id ?? null,
          employee_id: input.employee_id,
          assignment_id: input.assignment_id,
          schedule_id: input.schedule_id ?? null,
          event_type: input.event_type,
          client_captured_at: input.client_captured_at,
          latitude: input.latitude,
          longitude: input.longitude,
          accuracy_m: input.accuracy_m,
          distance_m: geo.distance_m,
          geofence_status: geo.geofence_status,
          photo_url: input.photo_url ?? null,
          source: 'MOBILE_PWA',
          idempotency_key: idempotencyKey,
        })
        .select('*')
        .single();

      if (error) return { data: null, error: mapError(error) };

      // Update / Upsert AttendanceDay summary
      const todayDay = await this.getTodayAttendanceDay(input.employee_id, dateStr);

      if (!todayDay.data) {
        await supabase.from('attendance_days').insert({
          organization_id: input.organization_id,
          business_unit_id: input.business_unit_id,
          location_id: input.location_id,
          employee_id: input.employee_id,
          schedule_id: input.schedule_id ?? null,
          work_date: dateStr,
          check_in_event_id: input.event_type === 'CHECK_IN' ? data.id : null,
          check_in_time: input.event_type === 'CHECK_IN' ? data.occurred_at_server : null,
          status: 'PRESENT',
        });
      } else {
        const updatePayload: Record<string, unknown> = {
          status: 'PRESENT',
        };
        if (input.event_type === 'CHECK_IN') {
          updatePayload.check_in_event_id = data.id;
          updatePayload.check_in_time = data.occurred_at_server;
        } else if (input.event_type === 'CHECK_OUT') {
          updatePayload.check_out_event_id = data.id;
          updatePayload.check_out_time = data.occurred_at_server;
        }
        await supabase.from('attendance_days').update(updatePayload).eq('id', todayDay.data.id);
      }

      return { data: data as AttendanceEvent };
    } catch (err) {
      return { data: null, error: mapError(err) };
    }
  },

  // Simulasi / Quick Punch untuk Testing & Demo langsung dari UI Admin
  async quickPunch(employeeId: string, eventType: 'CHECK_IN' | 'CHECK_OUT'): Promise<{ data: boolean; error?: AppError }> {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      await this.ensureDailySchedules(dateStr);

      // Cari assignment & schedule pegawai
      const { data: assign } = await supabase
        .from('attendance_employee_assignments')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!assign) return { data: false, error: { code: 'NO_ASSIGNMENT', message: 'Pegawai tidak memiliki assignment aktif' } };

      const { data: loc } = await supabase
        .from('attendance_locations')
        .select('*')
        .eq('id', assign.location_id)
        .single();

      const { data: sched } = await supabase
        .from('attendance_schedules')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('schedule_date', dateStr)
        .maybeSingle();

      const { data: org } = await supabase.from('attendance_organizations').select('id').limit(1).single();

      const result = await this.recordAttendanceEvent({
        organization_id: org?.id ?? '00000000-0000-0000-0000-000000000000',
        business_unit_id: assign.business_unit_id,
        location_id: assign.location_id,
        work_area_id: assign.primary_work_area_id ?? undefined,
        employee_id: employeeId,
        assignment_id: assign.id,
        schedule_id: sched?.id,
        event_type: eventType,
        client_captured_at: new Date().toISOString(),
        latitude: loc?.latitude ?? -6.9175,
        longitude: loc?.longitude ?? 107.6191,
        accuracy_m: 10,
        target_latitude: loc?.latitude ?? -6.9175,
        target_longitude: loc?.longitude ?? 107.6191,
        geofence_radius_m: loc?.geofence_radius_m ?? 150,
      });

      if (result.error) return { data: false, error: result.error };
      return { data: true };
    } catch (err) {
      return { data: false, error: mapError(err) };
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
  async getLiveMonitorStats(unitId?: string, dateStr = new Date().toISOString().split('T')[0]): Promise<{
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

      const days = (data ?? []) as unknown as AttendanceDay[];
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
