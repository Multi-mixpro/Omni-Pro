import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertOctagon,
  ShieldCheck,
  Calendar,
  Table,
  Building2,
  Send,
  MapPin,
  Sparkles,
  ChevronRight,
  Eye,
  MessageCircle,
} from 'lucide-react';
import {
  UnitType,
  AttendanceRecord,
  SuddenAbsenceAlert,
} from '../types';
import { useBusinessUnits } from '../data/PresensiDataContext';
import { getWhatsAppLink, WA_TEMPLATES } from '../utils/whatsapp';

interface MonitoringDashboardProps {
  selectedUnit: UnitType;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  records: AttendanceRecord[];
  alerts: SuddenAbsenceAlert[];
  onOpenTableModal: () => void;
  onSendPushAlert: (alert: SuddenAbsenceAlert) => void;
  onResolveAlert: (alertId: string) => void;
  onOpenMobilePresensi: () => void;
  onSelectEmployeeForDetail?: (employeeCode: string) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  selectedUnit,
  selectedDate,
  setSelectedDate,
  records = [],
  alerts = [],
  onOpenTableModal,
  onSendPushAlert,
  onResolveAlert,
  onOpenMobilePresensi,
  onSelectEmployeeForDetail,
}) => {
  // Data referensi nyata dari schema presensi (menggantikan konstanta mock).
  const BUSINESS_UNITS = useBusinessUnits();
  // Filter records by unit
  const filteredRecords =
    selectedUnit === 'ALL'
      ? records
      : records.filter((r) => r.unitId === selectedUnit);

  // Filter alerts
  const filteredAlerts =
    selectedUnit === 'ALL'
      ? alerts
      : alerts.filter((a) => a.unitId === selectedUnit);

  // Compute metrics
  const totalEmployees =
    selectedUnit === 'ALL'
      ? 44
      : BUSINESS_UNITS.find((u) => u.id === selectedUnit)?.totalEmployees || 0;

  const hadirCount = filteredRecords.filter((r) => r.status === 'HADIR').length;
  const terlambatCount = filteredRecords.filter((r) => r.status === 'TERLAMBAT').length;
  const sakitIzinCount = filteredRecords.filter(
    (r) => r.status === 'SAKIT' || r.status === 'IZIN'
  ).length;
  const alphaCount = filteredRecords.filter((r) => r.status === 'ALPHA').length;

  const totalPresent = hadirCount + terlambatCount;
  const attendanceRate = totalEmployees > 0 ? Math.round((totalPresent / totalEmployees) * 100) : 0;

  const geofenceValidCount = filteredRecords.filter(
    (r) => r.geofenceStatus === 'VALID' && (r.status === 'HADIR' || r.status === 'TERLAMBAT')
  ).length;
  const geofenceRate = totalPresent > 0 ? Math.round((geofenceValidCount / totalPresent) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Date & Quick Action Header Banner (Crextio / iOS Modern Clean) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/80 rounded-2xl border border-blue-100 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Monitoring Real-Time
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                ● Live Sync
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              Monitoring Kehadiran {selectedDate === new Date().toISOString().split('T')[0] ? 'Hari Ini' : selectedDate}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Unit Usaha:{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {selectedUnit === 'ALL'
                  ? 'Semua Divisi (GG Supply, Gudskuy, Bakso Ujo)'
                  : BUSINESS_UNITS.find((u) => u.id === selectedUnit)?.name}
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold shadow-2xs"
          />

          <button
            onClick={onOpenTableModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all"
          >
            <Table className="w-4 h-4" />
            <span>Lihat Tabel Rekap Rinci</span>
          </button>

          <button
            onClick={onOpenMobilePresensi}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>Simulasi Absen Mobile</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Employees (Hero Card with Executive Deep Navy Accent) */}
        <div className="bg-gradient-to-br from-[#0c1938] via-[#0f1a30] to-[#172554] dark:from-[#0b1329] dark:via-[#0f1a30] dark:to-[#1a2d52] p-4 sm:p-5 rounded-3xl border border-blue-900/40 shadow-md flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/30 cursor-pointer text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-300">Total Tim</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-cyan-300">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {totalEmployees}
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
              Terdaftar Sistem
            </span>
          </div>
        </div>

        {/* Hadir Tepat Waktu */}
        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/15 dark:hover:shadow-blue-500/20 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-cyan-400">Present</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {hadirCount}
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-200/60 dark:border-blue-800">
              ↑ {attendanceRate}% Hari Ini
            </span>
          </div>
        </div>

        {/* Terlambat */}
        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-500/15 dark:hover:shadow-amber-500/20 hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">Late</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/80 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {terlambatCount}
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
              Geofence Verified
            </span>
          </div>
        </div>

        {/* Sakit / Izin */}
        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/70 dark:hover:shadow-slate-950/80 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Izin/Sakit</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-[#1a2847] flex items-center justify-center text-slate-600 dark:text-slate-300">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {sakitIzinCount}
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-[#1a2847] text-slate-600 dark:text-slate-300">
              Approved Docs
            </span>
          </div>
        </div>

        {/* Alpha / Tanpa Keterangan */}
        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between relative overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-rose-500/15 dark:hover:shadow-rose-500/20 hover:border-rose-300 dark:hover:border-rose-700 cursor-pointer">
          {alphaCount > 0 && (
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 rounded-bl-lg animate-ping" />
          )}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Absent</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {alphaCount}
          </div>
          <div className="mt-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              alphaCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800'
                : 'bg-slate-100 dark:bg-[#1a2847] text-slate-600 dark:text-slate-400'
            }`}>
              {alphaCount > 0 ? 'Push Alert Sent' : 'Nihil'}
            </span>
          </div>
        </div>

        {/* Geofence Compliance Rate */}
        <div className="bg-white/90 dark:bg-[#0f1a30] p-4 sm:p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/15 dark:hover:shadow-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Geofence</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {geofenceRate}%
          </div>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
              Akurasi GPS
            </span>
          </div>
        </div>
      </div>

      {/* Sudden Absence Alerts Section (Apple/iOS Clean Warning Card) */}
      {filteredAlerts.length > 0 && (
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <h3 className="text-sm font-extrabold text-rose-950 dark:text-rose-200">
                Alert Ketidakhadiran Mendadak! ({filteredAlerts.length} Kasus Terdeteksi)
              </h3>
            </div>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-bold">
              Notifikasi Otomatis Terkirim
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {alert.unitName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Terdeteksi: {alert.detectedAt}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {alert.employeeName}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                    Shift: {alert.shiftName} ({alert.scheduledTime})
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-bold">
                    Belum melakukan clock-in hingga batas waktu toleransi.
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={getWhatsAppLink('081298765432', WA_TEMPLATES.absenceAlert(alert.employeeName, alert.unitName, alert.shiftName))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                    title="Kirim Peringatan Keterlambatan via WhatsApp wa.me"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Notif WA</span>
                  </a>

                  <button
                    onClick={() => onSendPushAlert(alert)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs"
                    title="Kirim Notifikasi Push Aplikasi"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Push</span>
                  </button>

                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Employee Live Matrix */}
      <div className="bg-white/90 dark:bg-[#0f1a30] rounded-3xl border border-slate-200/90 dark:border-[#1a2847] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              Matrix Status Kehadiran Karyawan ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Pantau status clock-in, foto biometrik wajah, dan lokasi geofencing secara real-time.
            </p>
          </div>

          <button
            onClick={onOpenTableModal}
            className="text-xs font-bold text-blue-600 dark:text-cyan-400 hover:text-blue-700 flex items-center gap-1 shrink-0"
          >
            <span>Buka Tabel Lengkap</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Employee Cards Grid or Realtime Empty State */}
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 dark:bg-[#070e1c]/50 rounded-2xl border border-dashed border-slate-200 dark:border-[#1a2847] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-cyan-400 mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Belum Ada Record Presensi Hari Ini
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
              Karyawan belum melakukan clock-in untuk tanggal {selectedDate}. Anda dapat mencoba fitur presensi mandiri via Kios/Mobile.
            </p>
            <button
              onClick={onOpenMobilePresensi}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulasi Presensi Biometrik</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredRecords.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl border border-slate-200/90 dark:border-[#1a2847] bg-white/80 dark:bg-[#0c162c]/80 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Employee Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        r.photoUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                      }
                      alt={r.employeeName}
                      className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                    />
                    <div className="min-w-0">
                      <button
                        onClick={() => onSelectEmployeeForDetail?.(r.employeeCode)}
                        className="text-xs font-extrabold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-cyan-400 text-left truncate block w-full transition-colors group-hover:underline"
                        title="Klik untuk melihat rekap kehadiran karyawan"
                      >
                        {r.employeeName}
                      </button>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                        {r.employeeCode} • {r.unitId.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 uppercase tracking-wide ${
                      r.status === 'HADIR'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800'
                        : r.status === 'TERLAMBAT'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800'
                        : r.status === 'SAKIT' || r.status === 'IZIN'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>

                {/* Clock In Info Box */}
                <div className="space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50/80 dark:bg-[#070e1b]/80 p-3 rounded-xl border border-slate-100 dark:border-[#1a2847]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Shift:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {r.shiftName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Clock In:</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">
                      {r.checkInTime || 'Belum Absen'}
                    </span>
                  </div>

                  {r.checkInTime && (
                    <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/60 dark:border-[#1a2847]">
                      <span className="flex items-center gap-1 text-slate-500 font-semibold">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        {r.distanceMeters}m GPS
                      </span>
                      {r.faceMatchScore > 0 && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          {r.faceMatchScore}% Face
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* View Detail Quick Link */}
              <button
                onClick={() => onSelectEmployeeForDetail?.(r.employeeCode)}
                className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1a2847] text-[10px] font-extrabold text-blue-600 dark:text-cyan-400 hover:underline flex items-center justify-between w-full"
              >
                <span>Lihat Rekap Kehadiran</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Unit Breakdown Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BUSINESS_UNITS.map((unit) => {
          const uRecords = records.filter((r) => r.unitId === unit.id);
          const uHadir = uRecords.filter((r) => r.status === 'HADIR' || r.status === 'TERLAMBAT').length;
          const uPct = Math.round((uHadir / unit.totalEmployees) * 100);

          return (
            <div
              key={unit.id}
              className="bg-white/90 dark:bg-[#0f1a30] p-5 rounded-3xl border border-slate-200/90 dark:border-[#1a2847] shadow-xs"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-xs"
                    style={{ backgroundColor: unit.color }}
                  />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {unit.name}
                  </h4>
                </div>
                <span className="text-xs font-extrabold text-blue-600 dark:text-cyan-400">
                  {uPct}% Hadir
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 truncate">
                {unit.tagline}
              </p>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-[#070e1b] overflow-hidden mb-2.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${uPct}%`,
                    backgroundColor: unit.color,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                <span>{uHadir} Karyawan Masuk</span>
                <span>Total {unit.totalEmployees} Karyawan</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
