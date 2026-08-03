import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Building2,
  Phone,
  Mail,
  Award,
  Edit3,
  Download,
  Filter,
  KeyRound,
  MessageCircle,
} from 'lucide-react';
import { Employee, AttendanceRecord, AttendanceStatus, Shift } from '../types';
import * as XLSX from 'xlsx';
import { getWhatsAppLink, WA_TEMPLATES } from '../utils/whatsapp';

interface EmployeeDetailModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  attendanceRecords: AttendanceRecord[];
  shifts: Shift[];
  onUpdateRecordStatus?: (
    recordId: string,
    newStatus: AttendanceStatus,
    notes?: string
  ) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  isOpen,
  onClose,
  attendanceRecords = [],
  shifts = [],
  onUpdateRecordStatus,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  if (!isOpen || !employee) return null;

  // Filter attendance records for this employee
  const employeeLogs = attendanceRecords.filter(
    (r) => r.employeeId === employee.id || r.employeeCode === employee.employeeCode
  );

  const filteredLogs = employeeLogs.filter((r) => {
    if (selectedMonth === 'ALL') return true;
    return r.date.startsWith(selectedMonth);
  });

  // Calculate Employee Metrics
  const totalLogs = employeeLogs.length;
  const hadirCount = employeeLogs.filter((r) => r.status === 'HADIR').length;
  const lateCount = employeeLogs.filter((r) => r.status === 'TERLAMBAT').length;
  const izinSakitCount = employeeLogs.filter(
    (r) => r.status === 'SAKIT' || r.status === 'IZIN'
  ).length;
  const alphaCount = employeeLogs.filter((r) => r.status === 'ALPHA').length;

  const validGeofenceLogs = employeeLogs.filter(
    (r) => r.geofenceStatus === 'VALID'
  ).length;
  const geofenceAccuracy = totalLogs > 0 ? Math.round((validGeofenceLogs / totalLogs) * 100) : 100;

  const totalFaceScores = employeeLogs.reduce(
    (acc, r) => acc + (r.faceMatchScore || 0),
    0
  );
  const avgFaceScore =
    totalLogs > 0 && totalFaceScores > 0
      ? (totalFaceScores / employeeLogs.filter((r) => r.faceMatchScore > 0).length || 1).toFixed(1)
      : '98.5';

  const employeeShift = shifts.find((s) => s.id === employee.shiftId);

  const handleExportIndividual = () => {
    const data = filteredLogs.map((log, i) => ({
      No: i + 1,
      Tanggal: log.date,
      Shift: log.shiftName,
      'Jam Masuk': log.checkInTime || '--:--',
      'Jam Keluar': log.checkOutTime || '--:--',
      Status: log.status,
      Geofence: log.geofenceStatus,
      'Jarak GPS (meter)': log.distanceMeters || 0,
      'Face Match (%)': log.faceMatchScore || 0,
      Catatan: log.notes || '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      `Presensi_${employee.employeeCode}`
    );
    XLSX.writeFile(
      workbook,
      `Rekap_Presensi_${employee.name.replace(/\s+/g, '_')}_${employee.employeeCode}.xlsx`
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* iOS Styled Header */}
        <div className="p-5 bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {employee.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {employee.employeeCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    employee.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {employee.status === 'ACTIVE' ? 'Aktif' : 'Non-Aktif'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                {employee.role} • Unit:{' '}
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {employee.unitId.replace('_', ' ')}
                </span>
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  @{employee.username || employee.name.toLowerCase().replace(/\s+/g, '.')}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {employee.email}
                </span>
                <a
                  href={getWhatsAppLink(employee.phone, `Halo ${employee.name}, ini pesan resmi dari Tim HR Enterprise.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] hover:bg-emerald-200 dark:hover:bg-emerald-900 transition flex items-center gap-1"
                  title="Hubungi via WhatsApp wa.me"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WA: {employee.phone}</span>
                </a>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Shift: {employeeShift ? employeeShift.name : 'Shift Regular'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Attendance Summary Cards (iOS Metric Style) */}
        <div className="p-5 bg-slate-50/60 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {/* Hadir */}
            <div className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Hadir Tepat
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {hadirCount} Hari
              </div>
              <span className="text-[10px] text-slate-400">On-Time Attendance</span>
            </div>

            {/* Terlambat */}
            <div className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Terlambat
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {lateCount} Kali
              </div>
              <span className="text-[10px] text-slate-400">Toleransi Shift</span>
            </div>

            {/* Sakit/Izin */}
            <div className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Izin / Sakit
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {izinSakitCount} Hari
              </div>
              <span className="text-[10px] text-slate-400">Surat Keterangan</span>
            </div>

            {/* Alpha */}
            <div className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Alpha
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {alphaCount} Hari
              </div>
              <span className="text-[10px] text-slate-400">Tanpa Kabar</span>
            </div>

            {/* Biometric Score */}
            <div className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                Skor Wajah
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {avgFaceScore}%
              </div>
              <span className="text-[10px] text-slate-400">Biometric Accuracy</span>
            </div>

            {/* Geofence Accuracy */}
            <div className="bg-white dark:bg-slate-800/90 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                GPS Valid
              </span>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {geofenceAccuracy}%
              </div>
              <span className="text-[10px] text-slate-400">Geofence Match</span>
            </div>
          </div>
        </div>

        {/* Content Body: Attendance Table */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Histori & Log Kehadiran Karyawan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Catatan presensi biometrik lengkap beserta waktu clock-in, clock-out, dan posisi GPS.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
              >
                <option value="ALL">Semua Periode</option>
                <option value="2026-08">Agustus 2026</option>
                <option value="2026-07">Juli 2026</option>
              </select>

              <button
                onClick={handleExportIndividual}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor Excel</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Tanggal</th>
                  <th className="py-3 px-3.5">Shift</th>
                  <th className="py-3 px-3.5">Masuk</th>
                  <th className="py-3 px-3.5">Keluar</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Biometrik & GPS</th>
                  <th className="py-3 px-3.5">Catatan</th>
                  {onUpdateRecordStatus && <th className="py-3 px-3.5">Aksi Koreksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {log.date}
                      </td>
                      <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                        {log.shiftName}
                      </td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {log.checkInTime || '--:--'}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-500 dark:text-slate-400">
                        {log.checkOutTime || '--:--'}
                      </td>
                      <td className="py-3 px-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            log.status === 'HADIR'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.status === 'TERLAMBAT'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : log.status === 'SAKIT' || log.status === 'IZIN'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          {log.faceMatchScore > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              Face {log.faceMatchScore}%
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">-</span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {log.distanceMeters > 0 ? `${log.distanceMeters}m` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 dark:text-slate-400 max-w-[180px] truncate">
                        {log.notes || '-'}
                      </td>
                      {onUpdateRecordStatus && (
                        <td className="py-3 px-3.5">
                          <select
                            value={log.status}
                            onChange={(e) =>
                              onUpdateRecordStatus(
                                log.id,
                                e.target.value as AttendanceStatus,
                                'Koreksi Manajerial Profil Karyawan'
                              )
                            }
                            className="py-1 px-2 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          >
                            <option value="HADIR">HADIR</option>
                            <option value="TERLAMBAT">TERLAMBAT</option>
                            <option value="SAKIT">SAKIT</option>
                            <option value="IZIN">IZIN</option>
                            <option value="ALPHA">ALPHA</option>
                          </select>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-slate-400 italic text-xs"
                    >
                      Belum ada catatan presensi pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold transition-all"
          >
            Tutup Profil Karyawan
          </button>
        </div>
      </div>
    </div>
  );
};
