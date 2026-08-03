export type UnitType = 'GG_SUPPLY' | 'GUDSKUY' | 'BAKSO_UJO' | 'ALL';

export interface BusinessUnit {
  id: UnitType;
  name: string;
  tagline: string;
  category: string;
  iconName: string;
  color: string;
  address: string;
  province?: string;
  city?: string;
  postalCode?: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  totalEmployees: number;
  wifiSsid?: string;
  wifiBssid?: string;
  allowOutsideGeofence?: boolean;
  requireBiometric?: boolean;
  operatingHours?: string;
  timeZone?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
}

export type AttendanceStatus = 'HADIR' | 'TERLAMBAT' | 'SAKIT' | 'IZIN' | 'ALPHA' | 'LIBUR';

export interface Shift {
  id: string;
  unitId: UnitType;
  name: string;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "17:00"
  toleranceMinutes: number;
  color: string;
  description: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  role: string;
  unitId: Exclude<UnitType, 'ALL'>;
  avatar: string;
  email: string;
  phone: string;
  shiftId: string;
  faceRegistered: boolean;
  registeredDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  username?: string;
  password?: string;
  pinCode?: string;
  sessionToken?: string;
  faceDescriptor?: any;
  portalAccessEnabled?: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  unitId: Exclude<UnitType, 'ALL'>;
  date: string; // YYYY-MM-DD
  shiftName: string;
  checkInTime?: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  status: AttendanceStatus;
  geofenceStatus: 'VALID' | 'INVALID' | 'OUT_OF_RANGE';
  distanceMeters: number;
  faceMatchScore: number; // e.g. 98.5%
  photoUrl?: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface SuddenAbsenceAlert {
  id: string;
  employeeId: string;
  employeeName: string;
  unitId: Exclude<UnitType, 'ALL'>;
  unitName: string;
  shiftName: string;
  scheduledTime: string;
  detectedAt: string;
  status: 'UNEXPLAINED' | 'REPORTED_SICK' | 'RESOLVED';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  notifiedVia: ('PUSH' | 'EMAIL')[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  unitId?: UnitType;
  action: string;
  category: 'AUTH' | 'ATTENDANCE' | 'SHIFT' | 'SECURITY' | 'PAYROLL_API' | 'EXPORT';
  ipAddress: string;
  device: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS' | 'WARNING';
  unitId?: UnitType;
  read: boolean;
  linkTab?: string;
}

export interface PayrollExportSummary {
  employeeId: string;
  employeeName: string;
  unitId: string;
  totalPresent: number;
  totalLate: number;
  totalSickPermit: number;
  totalAlpha: number;
  totalOvertimeHours: number;
  latePenaltyDeduction: number;
  calculatedBaseDays: number;
}
