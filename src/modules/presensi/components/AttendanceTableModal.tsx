import React, { useState } from 'react';
import {
  X,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  MapPin,
  Edit3,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, UnitType, BusinessUnit } from '../types';
import { useBusinessUnits } from '../data/PresensiDataContext';
import { exportAttendanceToExcel, exportAttendanceToPDF } from '../utils/exportHelpers';

interface AttendanceTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  records: AttendanceRecord[];
  selectedUnit: UnitType;
  onUpdateRecordStatus: (recordId: string, newStatus: AttendanceStatus, notes?: string) => void;
  onSelectEmployeeForDetail?: (employeeCode: string) => void;
}

export const AttendanceTableModal: React.FC<AttendanceTableModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  setSelectedDate,
  records = [],
  selectedUnit,
  onUpdateRecordStatus,
  onSelectEmployeeForDetail,
}) => {
  // Data referensi nyata dari schema presensi (menggantikan konstanta mock).
  const BUSINESS_UNITS = useBusinessUnits();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>(selectedUnit);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AttendanceStatus>('HADIR');
  const [editNotes, setEditNotes] = useState('');

  if (!isOpen) return null;

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUnit =
      unitFilter === 'ALL' ? true : r.unitId === unitFilter;

    const matchesStatus =
      statusFilter === 'ALL' ? true : r.status === statusFilter;

    return matchesSearch && matchesUnit && matchesStatus;
  });

  const handleSaveEdit = () => {
    if (editingRecord) {
      onUpdateRecordStatus(editingRecord.id, editStatus, editNotes);
      setEditingRecord(null);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'HADIR':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'TERLAMBAT':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'SAKIT':
      case 'IZIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-800';
      case 'ALPHA':
        return 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-800 animate-pulse';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const currentUnitName =
    unitFilter === 'ALL'
      ? 'Semua Unit Usaha'
      : BUSINESS_UNITS.find((u) => u.id === unitFilter)?.name || 'Unit Usaha';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-6xl bg-white dark:bg-[#0c162c] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1a2847] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1a2847] bg-slate-50 dark:bg-[#0f1a30]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Rekapitulasi Rinci Presensi Karyawan
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                {selectedDate}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tabel lengkap kehadiran, status geofencing, verifikasi wajah, dan jam masuk/pulang.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-[#1a2847] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Export Control Bar */}
        <div className="p-4 bg-white dark:bg-[#0f1a30] border-b border-slate-200 dark:border-[#1a2847] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left Inputs */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / kode karyawan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date Selector */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />

            {/* Unit Dropdown Filter */}
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Unit Usaha</option>
              <option value="GG_SUPPLY">GG Supply</option>
              <option value="GUDSKUY">Gudskuy</option>
              <option value="BAKSO_UJO">Bakso Ujo</option>
            </select>

            {/* Status Dropdown Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR">HADIR</option>
              <option value="TERLAMBAT">TERLAMBAT</option>
              <option value="SAKIT">SAKIT</option>
              <option value="IZIN">IZIN</option>
              <option value="ALPHA">ALPHA</option>
            </select>
          </div>

          {/* Right Export Buttons */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() =>
                exportAttendanceToExcel(filteredRecords, currentUnitName, selectedDate)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel</span>
            </button>

            <button
              onClick={() =>
                exportAttendanceToPDF(
                  filteredRecords,
                  currentUnitName,
                  selectedDate,
                  BUSINESS_UNITS
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-4">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tidak ada data presensi ditemukan
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Coba sesuaikan tanggal, filter status, atau kata kunci pencarian.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-3 px-3">Foto</th>
                    <th className="py-3 px-3">Karyawan</th>
                    <th className="py-3 px-3">Unit Usaha & Shift</th>
                    <th className="py-3 px-3">Masuk / Pulang</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Geofencing GPS</th>
                    <th className="py-3 px-3">Biometrik Wajah</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredRecords.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Photo Thumbnail */}
                      <td className="py-2.5 px-3">
                        {r.photoUrl ? (
                          <button
                            onClick={() => setPreviewPhoto(r.photoUrl!)}
                            className="relative group w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs focus:outline-none"
                            title="Klik untuk memperbesar foto absensi"
                          >
                            <img
                              src={r.photoUrl}
                              alt={r.employeeName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs">
                            {r.employeeName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </td>

                      {/* Employee Info */}
                      <td className="py-2.5 px-3">
                        <button
                          onClick={() => {
                            if (onSelectEmployeeForDetail) {
                              onSelectEmployeeForDetail(r.employeeCode);
                            }
                          }}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left transition-colors hover:underline block"
                          title="Klik untuk membuka rekap & histori kehadiran karyawan"
                        >
                          {r.employeeName}
                        </button>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {r.employeeCode}
                        </div>
                      </td>

                      {/* Unit & Shift */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {r.unitId.replace('_', ' ')}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {r.shiftName}
                        </div>
                      </td>

                      {/* In / Out */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-slate-900 dark:text-white font-semibold">
                          <Clock className="w-3 h-3 text-emerald-500" />
                          <span>{r.checkInTime || '-'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[10px]">
                          <span>Out: {r.checkOutTime || '-'}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            r.status
                          )}`}
                        >
                          {r.status}
                        </span>
                      </td>

                      {/* Geofence GPS */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span className="font-medium">{r.distanceMeters} meter</span>
                        </div>
                        <span
                          className={`inline-block text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                            r.geofenceStatus === 'VALID'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {r.geofenceStatus === 'VALID' ? 'Presensi di Lokasi' : 'Luar Radius'}
                        </span>
                      </td>

                      {/* Biometric Face Score */}
                      <td className="py-2.5 px-3">
                        {r.faceMatchScore > 0 ? (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{r.faceMatchScore}% Verified</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">
                            Tanpa Verifikasi
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setEditingRecord(r);
                            setEditStatus(r.status);
                            setEditNotes(r.notes || '');
                          }}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                          title="Koreksi Status Presensi"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer Summary */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Menampilkan <span className="font-bold text-slate-900 dark:text-white">{filteredRecords.length}</span> data dari total <span className="font-bold text-slate-900 dark:text-white">{records.length}</span> record presensi.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Tutup Table
          </button>
        </div>
      </div>

      {/* Photo Enlarge Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700 p-4 text-center">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Bukti Biometrik Snapshot Presensi
            </h3>
            <img
              src={previewPhoto}
              alt="Preview Snapshot"
              className="w-full h-72 object-cover rounded-xl border border-slate-700 shadow-inner mb-3"
            />
            <p className="text-xs text-slate-400">
              Biometric face recognition completed with liveness verification.
            </p>
          </div>
        </div>
      )}

      {/* Status Override Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Koreksi Status Presensi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {editingRecord.employeeName} ({editingRecord.employeeCode}) - {editingRecord.date}
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Status Baru
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as AttendanceStatus)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="HADIR">HADIR</option>
                  <option value="TERLAMBAT">TERLAMBAT</option>
                  <option value="SAKIT">SAKIT</option>
                  <option value="IZIN">IZIN</option>
                  <option value="ALPHA">ALPHA</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Alasan / Catatan
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Masukkan alasan koreksi manual HR..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
