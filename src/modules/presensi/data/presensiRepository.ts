/**
 * Akses & Pembaruan Data Presensi Multi-Unit.
 *
 * Seluruh data dibaca dan disimpan secara real-time ke Supabase database.
 * Pemetaan camelCase (frontend) <-> snake_case (database) dilakukan secara otomatis.
 */

import { supabase } from '../lib/supabase';
import type {
  AttendanceRecord,
  AttendanceStatus,
  BusinessUnit,
  Employee,
  Shift,
  UnitType,
} from '../types';

export interface RepoResult<T> {
  data: T;
  error?: string;
}

function errorText(reason: unknown): string {
  if (reason && typeof reason === 'object' && 'message' in reason) {
    return String((reason as { message: unknown }).message);
  }
  return 'Terjadi kesalahan saat menyimpan data.';
}

/** Ambil jam dari timestamp ISO menjadi HH:mm:ss waktu lokal. */
function timeOf(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toTimeString().slice(0, 8);
}

function mapUnit(row: Record<string, unknown>): BusinessUnit {
  return {
    id: String(row.id) as UnitType,
    name: String(row.name ?? ''),
    tagline: String(row.tagline ?? ''),
    category: String(row.category ?? ''),
    iconName: String(row.icon_name ?? 'Building2'),
    color: String(row.color ?? '#3178C6'),
    address: String(row.address ?? ''),
    province: (row.province as string) ?? undefined,
    city: (row.city as string) ?? undefined,
    postalCode: (row.postal_code as string) ?? undefined,
    landmark: (row.landmark as string) ?? undefined,
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    radiusMeters: Number(row.radius_meters ?? 100),
    totalEmployees: Number(row.total_employees ?? 0),
    wifiSsid: (row.wifi_ssid as string) ?? undefined,
    wifiBssid: (row.wifi_bssid as string) ?? undefined,
    allowOutsideGeofence: Boolean(row.allow_outside_geofence),
    requireBiometric: Boolean(row.require_biometric),
    operatingHours: (row.operating_hours as string) ?? undefined,
    timeZone: (row.time_zone as string) ?? undefined,
    managerName: (row.manager_name as string) ?? undefined,
    managerPhone: (row.manager_phone as string) ?? undefined,
    managerEmail: (row.manager_email as string) ?? undefined,
  };
}

function mapShift(row: Record<string, unknown>): Shift {
  return {
    id: String(row.id),
    unitId: String(row.unit_id) as UnitType,
    name: String(row.name ?? ''),
    startTime: String(row.start_time ?? '').slice(0, 5),
    endTime: String(row.end_time ?? '').slice(0, 5),
    toleranceMinutes: Number(row.tolerance_minutes ?? 0),
    color: String(row.color ?? ''),
    description: String(row.description ?? ''),
  };
}

function mapEmployee(row: Record<string, unknown>): Employee {
  return {
    id: String(row.id),
    employeeCode: String(row.employee_code ?? ''),
    name: String(row.name ?? ''),
    role: String(row.role ?? ''),
    unitId: String(row.unit_id) as Exclude<UnitType, 'ALL'>,
    avatar: String(row.avatar ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    shiftId: String(row.shift_id ?? ''),
    faceRegistered: Boolean(row.face_registered),
    registeredDate: String(row.created_at ?? '').slice(0, 10),
    status: (row.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'),
    username: (row.username as string) ?? undefined,
    password: (row.password as string) ?? undefined,
    portalAccessEnabled: Boolean(row.portal_access_enabled),
  };
}

function mapRecord(
  row: Record<string, unknown>,
  employeeById: Map<string, Employee>,
  shiftById: Map<string, Shift>,
  unitById: Map<string, BusinessUnit>,
): AttendanceRecord {
  const employee = employeeById.get(String(row.employee_id));
  const shift = row.shift_id ? shiftById.get(String(row.shift_id)) : undefined;
  const unit = unitById.get(String(row.unit_id));
  const distance = Number(row.distance_meters ?? row.check_in_distance_m ?? 0);
  const radius = unit?.radiusMeters ?? 0;

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: (row.employee_name as string) || employee?.name || '—',
    employeeCode: (row.employee_code as string) || employee?.employeeCode || '—',
    unitId: String(row.unit_id) as Exclude<UnitType, 'ALL'>,
    date: String(row.date ?? row.work_date ?? '').slice(0, 10),
    shiftName: (row.shift_name as string) || shift?.name || '—',
    checkInTime: (row.check_in_time as string) || timeOf(row.check_in_at as string),
    checkOutTime: (row.check_out_time as string) || timeOf(row.check_out_at as string),
    status: String(row.status ?? 'HADIR') as AttendanceStatus,
    geofenceStatus: radius > 0 && distance > radius ? 'OUT_OF_RANGE' : 'VALID',
    distanceMeters: distance,
    faceMatchScore: Number(row.face_match_score ?? 0),
    photoUrl: (row.photo_url as string) || (row.check_in_photo_url as string) || undefined,
    locationName: (row.location_name as string) || unit?.name || '—',
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    notes: (row.notes as string) ?? undefined,
  };
}

export const presensiRepository = {
  // READ METHODS
  async listUnits(): Promise<RepoResult<BusinessUnit[]>> {
    try {
      const [{ data, error }, { data: counts }] = await Promise.all([
        supabase.from('business_units').select('*').order('name'),
        supabase.from('employees').select('unit_id').eq('status', 'ACTIVE'),
      ]);
      if (error) return { data: [], error: error.message };

      const perUnit = new Map<string, number>();
      (counts ?? []).forEach((row: { unit_id: string }) => {
        perUnit.set(row.unit_id, (perUnit.get(row.unit_id) ?? 0) + 1);
      });

      return {
        data: (data ?? []).map((row) => {
          const unit = mapUnit(row);
          unit.totalEmployees = perUnit.get(unit.id) ?? 0;
          return unit;
        }),
      };
    } catch (reason) {
      return { data: [], error: errorText(reason) };
    }
  },

  async listShifts(unitId?: string): Promise<RepoResult<Shift[]>> {
    try {
      let query = supabase.from('shifts').select('*');
      if (unitId && unitId !== 'ALL') query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('start_time');
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []).map(mapShift) };
    } catch (reason) {
      return { data: [], error: errorText(reason) };
    }
  },

  async listEmployees(unitId?: string): Promise<RepoResult<Employee[]>> {
    try {
      let query = supabase.from('employees').select('*');
      if (unitId && unitId !== 'ALL') query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('name');
      if (error) return { data: [], error: error.message };
      return { data: (data ?? []).map(mapEmployee) };
    } catch (reason) {
      return { data: [], error: errorText(reason) };
    }
  },

  async listAttendance(unitId?: string, limit = 200): Promise<RepoResult<AttendanceRecord[]>> {
    try {
      const [units, shifts, employees] = await Promise.all([
        this.listUnits(),
        this.listShifts(),
        this.listEmployees(),
      ]);

      let query = supabase.from('attendance_records').select('*');
      if (unitId && unitId !== 'ALL') query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
      if (error) return { data: [], error: error.message };

      const employeeById = new Map(employees.data.map((e) => [e.id, e]));
      const shiftById = new Map(shifts.data.map((s) => [s.id, s]));
      const unitById = new Map(units.data.map((u) => [String(u.id), u]));

      return {
        data: (data ?? []).map((row) => mapRecord(row, employeeById, shiftById, unitById)),
      };
    } catch (reason) {
      return { data: [], error: errorText(reason) };
    }
  },

  // WRITE & UPDATE METHODS (SUPABASE REAL-TIME PERSISTENCE)
  async saveUnit(unit: Partial<BusinessUnit> & { id: string }): Promise<RepoResult<boolean>> {
    try {
      const payload: Record<string, unknown> = {
        id: unit.id,
      };
      if (unit.name !== undefined) payload.name = unit.name;
      if (unit.tagline !== undefined) payload.tagline = unit.tagline;
      if (unit.category !== undefined) payload.category = unit.category;
      if (unit.iconName !== undefined) payload.icon_name = unit.iconName;
      if (unit.color !== undefined) payload.color = unit.color;
      if (unit.address !== undefined) payload.address = unit.address;
      if (unit.province !== undefined) payload.province = unit.province;
      if (unit.city !== undefined) payload.city = unit.city;
      if (unit.postalCode !== undefined) payload.postal_code = unit.postalCode;
      if (unit.landmark !== undefined) payload.landmark = unit.landmark;
      if (unit.latitude !== undefined) payload.latitude = unit.latitude;
      if (unit.longitude !== undefined) payload.longitude = unit.longitude;
      if (unit.radiusMeters !== undefined) payload.radius_meters = unit.radiusMeters;
      if (unit.wifiSsid !== undefined) payload.wifi_ssid = unit.wifiSsid;
      if (unit.wifiBssid !== undefined) payload.wifi_bssid = unit.wifiBssid;
      if (unit.allowOutsideGeofence !== undefined) payload.allow_outside_geofence = unit.allowOutsideGeofence;
      if (unit.requireBiometric !== undefined) payload.require_biometric = unit.requireBiometric;
      if (unit.operatingHours !== undefined) payload.operating_hours = unit.operatingHours;
      if (unit.timeZone !== undefined) payload.time_zone = unit.timeZone;
      if (unit.managerName !== undefined) payload.manager_name = unit.managerName;
      if (unit.managerPhone !== undefined) payload.manager_phone = unit.managerPhone;
      if (unit.managerEmail !== undefined) payload.manager_email = unit.managerEmail;

      const { error } = await supabase.from('business_units').upsert(payload);
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },

  async saveEmployee(emp: Partial<Employee> & { id?: string; name: string; employeeCode: string; unitId: string; role: string }): Promise<RepoResult<boolean>> {
    try {
      const id = emp.id || `EMP_${Date.now()}`;
      const payload = {
        id,
        employee_code: emp.employeeCode,
        name: emp.name,
        role: emp.role,
        unit_id: emp.unitId,
        avatar: emp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        email: emp.email || '',
        phone: emp.phone || '',
        shift_id: emp.shiftId || null,
        face_registered: emp.faceRegistered ?? true,
        status: emp.status || 'ACTIVE',
        username: emp.username || emp.employeeCode.toLowerCase(),
        portal_access_enabled: emp.portalAccessEnabled ?? true,
      };

      const { error } = await supabase.from('employees').upsert(payload);
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },

  async deleteEmployee(employeeId: string): Promise<RepoResult<boolean>> {
    try {
      const { error } = await supabase.from('employees').delete().eq('id', employeeId);
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },

  async saveShift(shift: Partial<Shift> & { id?: string; name: string; unitId: string; startTime: string; endTime: string }): Promise<RepoResult<boolean>> {
    try {
      const id = shift.id || `SHIFT_${Date.now()}`;
      const payload = {
        id,
        unit_id: shift.unitId,
        name: shift.name,
        start_time: shift.startTime,
        end_time: shift.endTime,
        tolerance_minutes: shift.toleranceMinutes ?? 15,
        color: shift.color || '#3b82f6',
        description: shift.description || '',
      };

      const { error } = await supabase.from('shifts').upsert(payload);
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },

  async deleteShift(shiftId: string): Promise<RepoResult<boolean>> {
    try {
      const { error } = await supabase.from('shifts').delete().eq('id', shiftId);
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },

  async saveAttendanceRecord(record: AttendanceRecord): Promise<RepoResult<boolean>> {
    try {
      const payload = {
        id: record.id || `ATT_${Date.now()}`,
        employee_id: record.employeeId,
        employee_name: record.employeeName,
        employee_code: record.employeeCode,
        unit_id: record.unitId,
        date: record.date || new Date().toISOString().split('T')[0],
        shift_name: record.shiftName || '—',
        check_in_time: record.checkInTime || null,
        check_out_time: record.checkOutTime || null,
        status: record.status,
        geofence_status: record.geofenceStatus || 'VALID',
        distance_meters: record.distanceMeters || 0,
        face_match_score: record.faceMatchScore || 0,
        photo_url: record.photoUrl || null,
        location_name: record.locationName || null,
        latitude: record.latitude || null,
        longitude: record.longitude || null,
        notes: record.notes || null,
      };

      const { error } = await supabase.from('attendance_records').upsert(payload);
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },

  async listAuditLogs(limit = 50): Promise<RepoResult<Array<Record<string, unknown>>>> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) return { data: [], error: error.message };
      return { data: data ?? [] };
    } catch (reason) {
      return { data: [], error: errorText(reason) };
    }
  },

  /**
   * Verifikasi PIN karyawan di SERVER.
   *
   * Sebelumnya PIN dibandingkan di browser dan '123456'/'112233' selalu
  /**
   * Verifikasi PIN karyawan di SERVER.
   * Menerbitkan session token untuk autentikasi RPC selanjutnya.
   */
  async verifyEmployeePin(
    pin: string,
    deviceMode = 'PERSONAL'
  ): Promise<RepoResult<{ employee: Employee; sessionToken: string; faceDescriptor?: any } | null>> {
    try {
      const { data, error } = await supabase.rpc('verify_employee_pin', {
        p_pin: pin,
        p_device_mode: deviceMode,
      });
      if (error) return { data: null, error: error.message };

      const row = Array.isArray(data) ? data[0] : data;
      if (!row || !row.employee_id) return { data: null, error: 'PIN tidak dikenali.' };

      const sessionToken = String(row.session_token || '');
      const emp: Employee = {
        id: String(row.employee_id),
        employeeCode: String(row.employee_code ?? ''),
        name: String(row.name ?? ''),
        role: String(row.role ?? ''),
        unitId: String(row.unit_id) as Exclude<UnitType, 'ALL'>,
        shiftId: String(row.shift_id ?? ''),
        avatar: String(row.avatar ?? ''),
        email: '',
        phone: '',
        faceRegistered: Boolean(row.face_registered),
        registeredDate: '',
        status: 'ACTIVE',
        sessionToken,
        faceDescriptor: row.face_descriptor,
      };

      if (sessionToken) {
        localStorage.setItem('presensi_session_token', sessionToken);
      }

      return {
        data: {
          employee: emp,
          sessionToken,
          faceDescriptor: row.face_descriptor,
        },
      };
    } catch (reason) {
      return { data: null, error: errorText(reason) };
    }
  },

  async clockInRPC(params: {
    token: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
    faceScore?: number;
    photoUrl?: string;
    notes?: string;
  }): Promise<RepoResult<AttendanceRecord | null>> {
    try {
      const { data, error } = await supabase.rpc('clock_in', {
        p_token: params.token,
        p_lat: params.lat ?? null,
        p_lng: params.lng ?? null,
        p_accuracy_m: params.accuracy ?? null,
        p_face_score: params.faceScore ?? null,
        p_photo_url: params.photoUrl ?? null,
        p_notes: params.notes ?? null,
      });
      if (error) return { data: null, error: error.message };
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return { data: null, error: 'Gagal mencatat clock in.' };
      return {
        data: {
          id: String(row.id),
          employeeId: String(row.employee_id),
          employeeName: String(row.employee_name ?? '—'),
          employeeCode: String(row.employee_code ?? '—'),
          unitId: String(row.unit_id) as Exclude<UnitType, 'ALL'>,
          date: String(row.work_date ?? row.date ?? '').slice(0, 10),
          shiftName: String(row.shift_name ?? '—'),
          checkInTime: timeOf(row.check_in_at as string) || (row.check_in_time as string),
          checkOutTime: timeOf(row.check_out_at as string) || (row.check_out_time as string),
          status: String(row.status ?? 'HADIR') as AttendanceStatus,
          geofenceStatus: Boolean(row.is_flagged) ? 'OUT_OF_RANGE' : 'VALID',
          distanceMeters: Number(row.check_in_distance_m ?? row.distance_meters ?? 0),
          faceMatchScore: Number(row.face_match_score ?? 0),
          photoUrl: (row.check_in_photo_url as string) || (row.photo_url as string),
          locationName: (row.location_name as string) || '—',
          latitude: row.check_in_lat != null ? Number(row.check_in_lat) : undefined,
          longitude: row.check_in_lng != null ? Number(row.check_in_lng) : undefined,
          notes: (row.notes as string) ?? undefined,
        },
      };
    } catch (reason) {
      return { data: null, error: errorText(reason) };
    }
  },

  async clockOutRPC(params: {
    token: string;
    lat?: number;
    lng?: number;
    photoUrl?: string;
    notes?: string;
  }): Promise<RepoResult<AttendanceRecord | null>> {
    try {
      const { data, error } = await supabase.rpc('clock_out', {
        p_token: params.token,
        p_lat: params.lat ?? null,
        p_lng: params.lng ?? null,
        p_photo_url: params.photoUrl ?? null,
        p_notes: params.notes ?? null,
      });
      if (error) return { data: null, error: error.message };
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) return { data: null, error: 'Gagal mencatat clock out.' };
      return {
        data: {
          id: String(row.id),
          employeeId: String(row.employee_id),
          employeeName: String(row.employee_name ?? '—'),
          employeeCode: String(row.employee_code ?? '—'),
          unitId: String(row.unit_id) as Exclude<UnitType, 'ALL'>,
          date: String(row.work_date ?? row.date ?? '').slice(0, 10),
          shiftName: String(row.shift_name ?? '—'),
          checkInTime: timeOf(row.check_in_at as string) || (row.check_in_time as string),
          checkOutTime: timeOf(row.check_out_at as string) || (row.check_out_time as string),
          status: String(row.status ?? 'HADIR') as AttendanceStatus,
          geofenceStatus: Boolean(row.is_flagged) ? 'OUT_OF_RANGE' : 'VALID',
          distanceMeters: Number(row.check_in_distance_m ?? row.distance_meters ?? 0),
          faceMatchScore: Number(row.face_match_score ?? 0),
          photoUrl: (row.check_in_photo_url as string) || (row.photo_url as string),
          locationName: (row.location_name as string) || '—',
          latitude: row.check_in_lat != null ? Number(row.check_in_lat) : undefined,
          longitude: row.check_in_lng != null ? Number(row.check_in_lng) : undefined,
          notes: (row.notes as string) ?? undefined,
        },
      };
    } catch (reason) {
      return { data: null, error: errorText(reason) };
    }
  },

  async enrollFaceRPC(token: string, descriptor: any, referenceUrl?: string): Promise<RepoResult<boolean>> {
    try {
      const { error } = await supabase.rpc('enroll_face', {
        p_token: token,
        p_descriptor: descriptor,
        p_reference_url: referenceUrl ?? null,
      });
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },

  async endSessionRPC(token: string): Promise<void> {
    try {
      localStorage.removeItem('presensi_session_token');
      await supabase.rpc('end_session', { p_token: token });
    } catch (_) {
      // Ignore
    }
  },

  /** Peran pengelola milik sesi yang sedang aktif; null bila bukan pengelola. */
  async myManagerRole(): Promise<RepoResult<string | null>> {
    try {
      const { data, error } = await supabase.rpc('my_manager_role');
      if (error) return { data: null, error: error.message };
      return { data: (data as string) ?? null };
    } catch (reason) {
      return { data: null, error: errorText(reason) };
    }
  },

  /** Tetapkan PIN karyawan (disimpan sebagai hash bcrypt di server). */
  async setEmployeePin(employeeId: string, pin: string): Promise<RepoResult<boolean>> {
    try {
      const { error } = await supabase.rpc('set_employee_pin', {
        p_employee_id: employeeId,
        p_pin: pin,
      });
      if (error) return { data: false, error: error.message };
      return { data: true };
    } catch (reason) {
      return { data: false, error: errorText(reason) };
    }
  },
};
