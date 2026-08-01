// Central Attendance — Domain Types

export type AttendanceRole =
  | 'OWNER'
  | 'BUSINESS_UNIT_ADMIN'
  | 'LOCATION_MANAGER'
  | 'SUPERVISOR'
  | 'EMPLOYEE'
  | 'AUDITOR'
  | 'KIOSK';

export type EventType = 'CHECK_IN' | 'CHECK_OUT' | 'BREAK_START' | 'BREAK_END';
export type GeofenceStatus = 'WITHIN_GEOFENCE' | 'OUTSIDE_GEOFENCE';
export type DayStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'OFF'
  | 'NEEDS_REVIEW';

export type LeaveType = 'SICK' | 'ANNUAL_LEAVE' | 'PERMISSION' | 'BUSINESS_TRIP';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface Organization {
  id: string;
  name: string;
  code: string;
  timezone: string;
  created_at: string;
}

export interface BusinessUnit {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  brand_color: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WorkLocation {
  id: string;
  organization_id: string;
  business_unit_id: string;
  name: string;
  code: string;
  address: string | null;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
  max_allowed_accuracy_m: number;
  is_active: boolean;
  created_at: string;
  business_unit?: BusinessUnit;
}

export interface WorkArea {
  id: string;
  location_id: string;
  name: string;
  code: string;
  description: string | null;
  sequence_no: number;
  is_active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  organization_id: string;
  user_id: string | null; // auth.users(id), NOT profiles
  employee_no: string;
  full_name: string;
  username?: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  face_enrolled?: boolean;
  face_enrolled_at?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeAssignment {
  id: string;
  employee_id: string;
  business_unit_id: string;
  location_id: string;
  primary_work_area_id: string | null;
  job_title: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  business_unit?: BusinessUnit;
  location?: WorkLocation;
  employee?: Employee;
}

export interface AttendanceMembership {
  id: string;
  user_id: string;
  organization_id: string;
  business_unit_id: string | null;
  location_id: string | null;
  role: AttendanceRole;
  is_active: boolean;
  created_at: string;
  business_unit?: BusinessUnit;
  location?: WorkLocation;
}

export interface ShiftTemplate {
  id: string;
  organization_id: string;
  business_unit_id: string;
  name: string;
  code: string;
  start_time: string;
  end_time: string;
  is_cross_day: boolean;
  check_in_window_start_mins: number;
  check_in_window_end_mins: number;
  late_tolerance_mins: number;
  early_leave_tolerance_mins: number;
  is_active: boolean;
  created_at: string;
}

export interface EmployeeSchedule {
  id: string;
  employee_id: string;
  assignment_id: string;
  business_unit_id: string;
  location_id: string;
  work_area_id: string | null;
  shift_template_id: string;
  schedule_date: string;
  is_off: boolean;
  created_at: string;
  shift_template?: ShiftTemplate;
  location?: WorkLocation;
  business_unit?: BusinessUnit;
}

export interface AttendanceEvent {
  id: string;
  organization_id: string;
  business_unit_id: string;
  location_id: string;
  work_area_id: string | null;
  employee_id: string;
  assignment_id: string;
  schedule_id: string | null;
  event_type: EventType;
  occurred_at_server: string;
  client_captured_at: string;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  distance_m: number;
  geofence_status: GeofenceStatus;
  photo_url: string | null;
  device_id: string | null;
  source: string;
  risk_flags: Record<string, unknown>;
  idempotency_key: string | null;
  created_at: string;
}

export interface AttendanceDay {
  id: string;
  organization_id: string;
  business_unit_id: string;
  location_id: string;
  employee_id: string;
  schedule_id: string | null;
  work_date: string;
  check_in_event_id: string | null;
  check_out_event_id: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  late_mins: number;
  early_leave_mins: number;
  work_duration_mins: number;
  status: DayStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  check_in_event?: AttendanceEvent;
  check_out_event?: AttendanceEvent;
  employee?: Employee;
  schedule?: EmployeeSchedule;
}

export interface LeaveRequest {
  id: string;
  organization_id: string;
  business_unit_id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  attachment_url: string | null;
  status: RequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  employee?: Employee;
}

export interface CorrectionRequest {
  id: string;
  organization_id: string;
  business_unit_id: string;
  employee_id: string;
  attendance_day_id: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string;
  status: RequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  employee?: Employee;
}
