/**
 * Akses data Presensi Multi-Unit.
 *
 * Menggantikan src/data/mockData.ts: seluruh isi layar diambil dari schema
 * `presensi` di Supabase, bukan data contoh. Database memakai snake_case,
 * sedangkan tipe aplikasi memakai camelCase, sehingga pemetaan dilakukan di
 * sini agar komponen tidak perlu tahu bentuk barisnya.
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
  return 'Terjadi kesalahan saat mengambil data.';
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
    // Dihitung dari data karyawan, bukan kolom yang bisa basi.
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
    // Kolom password teks polos sengaja tidak ada di database; identitas
    // diverifikasi lewat PIN ter-hash dan pencocokan wajah.
    portalAccessEnabled: Boolean(row.user_id),
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
  const distance = Number(row.check_in_distance_m ?? 0);
  const radius = unit?.radiusMeters ?? 0;

  return {
    id: String(row.id),
    employeeId: String(row.employee_id),
    employeeName: employee?.name ?? '—',
    employeeCode: employee?.employeeCode ?? '—',
    unitId: String(row.unit_id) as Exclude<UnitType, 'ALL'>,
    date: String(row.work_date ?? '').slice(0, 10),
    shiftName: shift?.name ?? '—',
    checkInTime: timeOf(row.check_in_at as string),
    checkOutTime: timeOf(row.check_out_at as string),
    status: String(row.status ?? 'HADIR') as AttendanceStatus,
    geofenceStatus: radius > 0 && distance > radius ? 'OUT_OF_RANGE' : 'VALID',
    distanceMeters: distance,
    faceMatchScore: Number(row.face_match_score ?? 0),
    photoUrl: (row.check_in_photo_url as string) ?? undefined,
    locationName: unit?.name ?? '—',
    latitude: row.check_in_lat != null ? Number(row.check_in_lat) : undefined,
    longitude: row.check_in_lng != null ? Number(row.check_in_lng) : undefined,
    notes: (row.notes as string) ?? undefined,
  };
}

export const presensiRepository = {
  async listUnits(): Promise<RepoResult<BusinessUnit[]>> {
    try {
      const [{ data, error }, { data: counts }] = await Promise.all([
        supabase.from('business_units').select('*').eq('is_active', true).order('name'),
        supabase.from('employees').select('unit_id').eq('status', 'ACTIVE'),
      ]);
      if (error) return { data: [], error: error.message };

      // Jumlah karyawan dihitung dari data nyata agar tidak pernah basi.
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
      let query = supabase.from('shifts').select('*').eq('is_active', true);
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

  /** Catatan absen beserta nama karyawan, shift, dan lokasi yang sudah digabung. */
  async listAttendance(unitId?: string, limit = 200): Promise<RepoResult<AttendanceRecord[]>> {
    try {
      const [units, shifts, employees] = await Promise.all([
        this.listUnits(),
        this.listShifts(),
        this.listEmployees(),
      ]);

      let query = supabase.from('attendance_records').select('*');
      if (unitId && unitId !== 'ALL') query = query.eq('unit_id', unitId);
      const { data, error } = await query.order('work_date', { ascending: false }).limit(limit);
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
};
