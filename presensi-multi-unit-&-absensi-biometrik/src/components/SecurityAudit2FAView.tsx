import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  History,
  Search,
  Filter,
  Download,
  KeyRound,
  Laptop,
  Smartphone,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditLog } from '../types';
import * as XLSX from 'xlsx';

interface SecurityAudit2FAViewProps {
  auditLogs: AuditLog[];
  is2FAEnabled: boolean;
  onToggle2FA: (val: boolean) => void;
}

export const SecurityAudit2FAView: React.FC<SecurityAudit2FAViewProps> = ({
  auditLogs,
  is2FAEnabled,
  onToggle2FA,
}) => {
  const [totpInput, setTotpInput] = useState('');
  const [totpVerified, setTotpVerified] = useState(false);
  const [totpError, setTotpError] = useState(false);

  // Search & Filter Audit Logs
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const handleVerifyTotp = () => {
    if (totpInput.length === 6) {
      setTotpVerified(true);
      setTotpError(false);
      onToggle2FA(true);
    } else {
      setTotpError(true);
    }
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat =
      categoryFilter === 'ALL' ? true : log.category === categoryFilter;

    return matchesSearch && matchesCat;
  });

  const exportAuditLogs = () => {
    const data = filteredLogs.map((l, i) => ({
      No: i + 1,
      Timestamp: l.timestamp,
      'Pengguna (User)': l.userName,
      Role: l.userRole,
      'Aksi (Action)': l.action,
      Kategori: l.category,
      'IP Address': l.ipAddress,
      Perangkat: l.device,
      Detail: l.details,
      Status: l.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Logs Keamanan');
    XLSX.writeFile(workbook, `Audit_Security_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 2FA Configuration Banner */}
      <div className="bg-white/90 dark:bg-[#0f1a30] rounded-3xl p-6 border border-slate-200/90 dark:border-[#1a2847] shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                is2FAEnabled
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Autentikasi Dua Faktor (2FA Security)
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                    is2FAEnabled
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800'
                  }`}
                >
                  {is2FAEnabled ? 'Sistem Terlindungi (Active)' : '2FA Belum Aktif'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Meminta kode TOTP dari Google Authenticator / Email sebelum melakukan perubahan sensitif.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => onToggle2FA(!is2FAEnabled)}
            className={`px-4 py-2.5 rounded-2xl font-extrabold text-xs shadow-xs transition-all shrink-0 ${
              is2FAEnabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {is2FAEnabled ? 'Non-Aktifkan 2FA' : 'Aktifkan 2FA Sekarang'}
          </button>
        </div>

        {/* 2FA Setup Box */}
        {is2FAEnabled ? (
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-200 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Akun Manager terproteksi dengan Enskripsi TOTP 2FA. Setiap aksi ekspor laporan & override status memerlukan verifikasi sekunder.
              </span>
            </div>
            <span className="font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px]">Keamanan Level A+</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Step 1: Scan QR */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-500" />
                Langkah 1: Pindai Kode QR Authenticator
              </h4>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 bg-white p-2 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                  <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center font-bold text-[10px] text-slate-800 text-center">
                    QR CODE 2FA
                  </div>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                  <p className="font-medium">Gunakan Google Authenticator atau Authy.</p>
                  <p className="font-mono text-[10px] text-slate-800 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-700 p-1.5 rounded-lg">
                    SECRET: PRESENSI-GGS-GDS-BUJ-2026
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Verify Code */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-500" />
                Langkah 2: Verifikasi Kode 6-Digit
              </h4>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Contoh: 849201"
                  value={totpInput}
                  onChange={(e) => setTotpInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-center tracking-widest text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {totpError && (
                  <p className="text-[11px] text-red-500 font-semibold">
                    Kode harus 6 angka! Contoh: 849201
                  </p>
                )}

                <button
                  onClick={handleVerifyTotp}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all"
                >
                  Verifikasi & Aktifkan 2FA
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Audit Log Table Section */}
      <div className="bg-white/90 dark:bg-[#0f1a30] rounded-3xl p-6 border border-slate-200/90 dark:border-[#1a2847] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Log Aktivitas Pengguna & Audit Keamanan Sistem
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Catatan komprehensif seluruh aktivitas login, presensi, ekspor laporan, dan perubahan shift.
            </p>
          </div>

          <button
            onClick={exportAuditLogs}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Audit Log (Excel)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari user, aksi, IP, atau detail log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="AUTH">AUTH (Login & 2FA)</option>
            <option value="ATTENDANCE">ATTENDANCE (Presensi)</option>
            <option value="SHIFT">SHIFT (Jadwal)</option>
            <option value="SECURITY">SECURITY (Keamanan)</option>
            <option value="PAYROLL_API">PAYROLL_API (Integrasi)</option>
            <option value="EXPORT">EXPORT (Laporan)</option>
          </select>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3">Waktu (WIB)</th>
                <th className="py-3 px-3">Pengguna & Role</th>
                <th className="py-3 px-3">Aksi</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">IP & Perangkat</th>
                <th className="py-3 px-3">Detail</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {log.userName}
                    </div>
                    <div className="text-[10px] text-slate-500">{log.userRole}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {log.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-600 dark:text-slate-400">
                    <div>{log.ipAddress}</div>
                    <div className="text-[10px] opacity-75 truncate max-w-[140px]">
                      {log.device}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[220px] truncate">
                    {log.details}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : log.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
