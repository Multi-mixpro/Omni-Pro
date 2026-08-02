import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from '@/app/router/simpleRouter';
import { supabase } from '@/integrations/supabase/client';
import { useAttendanceUnits, useLiveMonitorStats } from '../hooks/useAttendance';
import {
  attendanceRepository,
  createAttendanceUser,
  enrollAttendanceFace,
  updateAttendanceUser,
} from '../data/attendanceRepository';
import { useQueryClient } from '@tanstack/react-query';
import { LoadingState } from '../components/AttendanceStateComponents';
import { FaceCaptureModal, type FaceCaptureResult } from '../components/FaceCaptureModal';
import '../attendance.css';

type AdminTab = 'dashboard' | 'employees' | 'shifts' | 'reports';

function compactAuditLogs(logs: any[]) {
  const compacted: Array<any & { occurrence_count: number }> = [];
  for (const log of logs) {
    const timeBucket = Math.floor(new Date(log.created_at).getTime() / (5 * 60 * 1000));
    const key = `${timeBucket}|${log.entity_type}|${log.entity_id}|${log.action}|${JSON.stringify(log.after_data ?? {})}`;
    const existing = compacted.find(item => item._compact_key === key);
    if (existing) {
      existing.occurrence_count += 1;
      continue;
    }
    compacted.push({ ...log, _compact_key: key, occurrence_count: 1 });
  }
  return compacted;
}

function auditActionLabel(action?: string) {
  const labels: Record<string, string> = {
    CREATE: 'data dibuat',
    UPDATE: 'data diperbarui',
    DEACTIVATE: 'karyawan dinonaktifkan',
    ENROLL: 'wajah didaftarkan',
    REENROLL: 'wajah didaftarkan ulang',
    FACE_MISMATCH: 'verifikasi wajah ditolak',
    CHECK_IN: 'presensi masuk',
    CHECK_OUT: 'presensi pulang',
  };
  return labels[action ?? ''] ?? action?.toLocaleLowerCase('id-ID') ?? 'aktivitas sistem';
}

function attendanceStatusLabel(day: any) {
  if (day.check_out_time) return 'Selesai';
  if (day.check_in_time) return day.status === 'LATE' ? 'Hadir terlambat' : 'Sedang bekerja';
  if (day.status === 'ON_LEAVE') return 'Izin/cuti';
  return 'Belum hadir';
}

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [employeeNotice, setEmployeeNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Real-time Supabase Data States
  const [dbEmployees, setDbEmployees] = useState<any[]>([]);
  const [dbShifts, setDbShifts] = useState<any[]>([]);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modal States
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingEmp, setEditingEmp] = useState<any | null>(null);
  const [editingShift, setEditingShift] = useState<any | null>(null);
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<{ employee: any; days: any[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpNo, setNewEmpNo] = useState('');
  const [newEmpPin, setNewEmpPin] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('Staf Service & Frontline');
  const [newEmpUnitId, setNewEmpUnitId] = useState<string>('');
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [faceScanning, setFaceScanning] = useState(false);
  const [biometricConsent, setBiometricConsent] = useState(false);
  const [pendingFaceCapture, setPendingFaceCapture] = useState<FaceCaptureResult | null>(null);
  const [biometricFormError, setBiometricFormError] = useState('');

  // Shift Form State
  const [shiftName, setShiftName] = useState('');
  const [shiftCode, setShiftCode] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [lateTolerance, setLateTolerance] = useState('15');

  const { data: unitsRes, isLoading: unitsLoading } = useAttendanceUnits();
  const { data: statsRes, isLoading: statsLoading, refetch } = useLiveMonitorStats(selectedUnitId);

  const units = unitsRes?.data ?? [];
  const stats = statsRes?.data;
  const days = stats?.days ?? [];

  // Load Real-time Data from Supabase
  const fetchRealtimeData = useCallback(async () => {
    setLoadingData(true);
    const [empRes, shiftRes, logRes] = await Promise.all([
      attendanceRepository.listEmployeesWithAssignments(),
      attendanceRepository.listShiftTemplates(selectedUnitId),
      attendanceRepository.listAuditLogs(),
    ]);

    if (empRes.data) setDbEmployees(empRes.data);
    if (shiftRes.data) setDbShifts(shiftRes.data);
    if (logRes.data) setDbLogs(logRes.data);
    setLoadingData(false);
  }, [selectedUnitId]);

  useEffect(() => {
    void fetchRealtimeData();
  }, [activeTab, fetchRealtimeData]);

  useEffect(() => {
    let refreshTimer: number | undefined;
    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => {
        void fetchRealtimeData();
        void refetch();
        void queryClient.invalidateQueries({ queryKey: ['attendance-monitor'] });
      }, 180);
    };

    let channel = supabase.channel(`attendance-admin-realtime-${selectedUnitId ?? 'all'}`);
    for (const table of [
      'attendance_employees',
      'attendance_employee_assignments',
      'attendance_shift_templates',
      'attendance_schedules',
      'attendance_events',
      'attendance_days',
      'attendance_audit_logs',
    ]) {
      channel = channel.on('postgres_changes', { event: '*', schema: 'public', table }, scheduleRefresh);
    }
    channel.subscribe();

    return () => {
      window.clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [fetchRealtimeData, queryClient, refetch, selectedUnitId]);

  async function handleAutoSchedule() {
    setActionLoadingId('auto_sched');
    await attendanceRepository.ensureDailySchedules();
    setActionLoadingId(null);
    queryClient.invalidateQueries({ queryKey: ['attendance-monitor'] });
    refetch();
    fetchRealtimeData();
  }

  // CREATE / EDIT EMPLOYEE REALTIME
  async function handleSaveEmployee(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmpName || !newEmpNo) {
      alert('Nama dan NIP wajib diisi.');
      return;
    }

    setActionLoadingId('save_emp');

    if (editingEmp) {
      try {
        await updateAttendanceUser({
          employee_id: editingEmp.id,
          full_name: newEmpName,
          employee_no: newEmpNo,
          pin: newEmpPin || undefined,
          job_title: newEmpRole,
        });
        let biometricWarning = '';
        if (pendingFaceCapture) {
          try {
            await enrollAttendanceFace(editingEmp.id, pendingFaceCapture);
          } catch (reason) {
            biometricWarning = reason instanceof Error ? reason.message : 'Pendaftaran wajah gagal.';
          }
        }
        setEmployeeNotice({
          type: biometricWarning ? 'error' : 'success',
          message: biometricWarning
            ? `Data ${newEmpName} tersimpan, tetapi wajah belum terdaftar: ${biometricWarning}`
            : `Pegawai ${newEmpName} berhasil diperbarui${pendingFaceCapture ? ' dan wajah tersimpan secara privat' : ''}.`,
        });
        setShowEmployeeModal(false);
        setEditingEmp(null);
        setPendingFaceCapture(null);
        setBiometricConsent(false);
        await fetchRealtimeData();
      } catch (reason) {
        setEmployeeNotice({ type: 'error', message: reason instanceof Error ? reason.message : 'Pegawai gagal diperbarui.' });
      }
    } else {
      // CREATE — membuat akun login Attendance sekaligus data karyawan.
      // Akun Auth kru memakai secret acak; PIN hanya disimpan sebagai hash.
      const chosenUnitId = newEmpUnitId || units[0]?.id;
      if (!chosenUnitId) {
        alert('Unit bisnis belum tersedia. Buat unit terlebih dahulu.');
        setActionLoadingId(null);
        return;
      }

      const locRes = await attendanceRepository.listLocations(chosenUnitId);
      const mainLoc = locRes.data[0];
      if (!mainLoc) {
        alert('Unit ini belum memiliki lokasi kerja. Tambahkan lokasi sebelum mendaftarkan pegawai.');
        setActionLoadingId(null);
        return;
      }

      if (!/^\d{6}$/.test(newEmpPin)) {
        alert('PIN kru wajib tepat 6 digit.');
        setActionLoadingId(null);
        return;
      }

      try {
        const created = await createAttendanceUser({
          employee_no: newEmpNo,
          pin: newEmpPin,
          full_name: newEmpName,
          role: 'EMPLOYEE',
          business_unit_id: chosenUnitId,
          location_id: mainLoc.id,
          job_title: newEmpRole,
        });

        let biometricWarning = '';
        if (pendingFaceCapture) {
          try {
            await enrollAttendanceFace(created.employee_id, pendingFaceCapture);
          } catch (reason) {
            biometricWarning = reason instanceof Error ? reason.message : 'Pendaftaran wajah gagal.';
          }
        }
        setEmployeeNotice({
          type: biometricWarning ? 'error' : 'success',
          message: biometricWarning
            ? `Pegawai ${newEmpName} berhasil dibuat, tetapi wajah belum terdaftar: ${biometricWarning}`
            : `Pegawai ${newEmpName} (${created.employee_no}) berhasil dibuat${pendingFaceCapture ? ' dan wajah sudah terdaftar' : ''}.`,
        });
        setShowEmployeeModal(false);
        setNewEmpName('');
        setNewEmpNo('');
        setNewEmpPin('');
        setFaceEnrolled(false);
        setPendingFaceCapture(null);
        setBiometricConsent(false);
        await attendanceRepository.ensureDailySchedules();
        await fetchRealtimeData();
        await refetch();
      } catch (reason) {
        setEmployeeNotice({ type: 'error', message: reason instanceof Error ? reason.message : 'Pegawai gagal dibuat.' });
      }
    }

    setActionLoadingId(null);
  }

  // DELETE EMPLOYEE REALTIME
  async function handleDeleteEmployee(empId: string, empNameStr: string) {
    if (!confirm(`Hapus ${empNameStr} dari daftar karyawan aktif? Riwayat presensi tetap disimpan.`)) return;

    setEmployeeNotice(null);
    setActionLoadingId(`del_${empId}`);
    const res = await attendanceRepository.deleteEmployee(empId);
    setActionLoadingId(null);

    if (res.data) {
      setDbEmployees(prev => prev.filter(e => e.id !== empId));
      setEmployeeNotice({
        type: 'success',
        message: `Pegawai ${empNameStr} telah dinonaktifkan. Riwayat presensi tetap tersimpan.`,
      });
      await Promise.all([
        fetchRealtimeData(),
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['attendance-monitor'] }),
      ]);
    } else {
      setEmployeeNotice({
        type: 'error',
        message: `Gagal menghapus ${empNameStr}: ${res.error?.message ?? 'Terjadi kesalahan'}`,
      });
    }
  }

  // CREATE / EDIT SHIFT REALTIME
  async function handleSaveShift(e: React.FormEvent) {
    e.preventDefault();
    if (!shiftName) {
      alert('Nama Shift wajib diisi.');
      return;
    }

    setActionLoadingId('save_shift');

    if (editingShift) {
      // UPDATE Realtime
      const res = await attendanceRepository.updateShiftTemplate(editingShift.id, {
        name: shiftName,
        start_time: startTime.includes(':') ? (startTime.length === 5 ? `${startTime}:00` : startTime) : '08:00:00',
        end_time: endTime.includes(':') ? (endTime.length === 5 ? `${endTime}:00` : endTime) : '17:00:00',
        late_tolerance_mins: parseInt(lateTolerance, 10) || 15,
      });

      if (res.data) {
        alert(`Template shift ${shiftName} berhasil diperbarui di Supabase!`);
        setShowShiftModal(false);
        setEditingShift(null);
        fetchRealtimeData();
      } else {
        alert(`Gagal: ${res.error?.message}`);
      }
    } else {
      // CREATE Realtime
      const ujoUnit = units.find(u => u.code === 'BAKSO_UJO') ?? units[0];

      const res = await attendanceRepository.createShiftTemplate({
        business_unit_id: ujoUnit?.id ?? '00000000-0000-0000-0000-000000000000',
        name: shiftName,
        code: shiftCode || `SHIFT_${Date.now()}`,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        late_tolerance_mins: parseInt(lateTolerance, 10) || 15,
      });

      if (res.data) {
        alert(`Template shift ${shiftName} berhasil disimpan ke Supabase!`);
        setShowShiftModal(false);
        setShiftName('');
        setShiftCode('');
        fetchRealtimeData();
      } else {
        alert(`Gagal: ${res.error?.message}`);
      }
    }

    setActionLoadingId(null);
  }

  // DELETE SHIFT REALTIME
  async function handleDeleteShift(shiftId: string, shiftNameStr: string) {
    if (!confirm(`Hapus template shift ${shiftNameStr} dari Supabase?`)) return;

    setActionLoadingId(`del_shift_${shiftId}`);
    const res = await attendanceRepository.deleteShiftTemplate(shiftId);
    setActionLoadingId(null);

    if (res.data) {
      alert(`Shift ${shiftNameStr} telah berhasil dihapus!`);
      setDbShifts(prev => prev.filter(s => s.id !== shiftId));
      fetchRealtimeData();
    } else {
      alert(`Gagal menghapus shift: ${res.error?.message ?? 'Terjadi kesalahan'}`);
    }
  }

  function handleOpenEditEmployee(emp: any) {
    setEditingEmp(emp);
    setNewEmpName(emp.full_name);
    setNewEmpNo(emp.employee_no);
    setNewEmpPin('');
    setNewEmpRole(emp.assignments?.[0]?.job_title ?? 'Staf Operasional');
    setNewEmpUnitId(emp.assignments?.[0]?.business_unit_id ?? '');
    setFaceEnrolled(emp.face_enrolled === true);
    setPendingFaceCapture(null);
    setBiometricConsent(false);
    setBiometricFormError('');
    setShowEmployeeModal(true);
  }

  function handleOpenEditShift(shift: any) {
    setEditingShift(shift);
    setShiftName(shift.name);
    setShiftCode(shift.code);
    setStartTime(shift.start_time ? shift.start_time.slice(0, 5) : '08:00');
    setEndTime(shift.end_time ? shift.end_time.slice(0, 5) : '17:00');
    setLateTolerance(String(shift.late_tolerance_mins ?? 15));
    setShowShiftModal(true);
  }

  function handleScanFace() {
    if (!biometricConsent) {
      setBiometricFormError('Konfirmasi persetujuan karyawan sebelum membuka kamera.');
      return;
    }
    setBiometricFormError('');
    setFaceScanning(true);
  }

  async function handleOpenEmployeeHistory(employee: any) {
    setHistoryLoading(true);
    setSelectedEmployeeHistory({ employee, days: [] });
    const history = await attendanceRepository.getEmployeeHistory(employee.id);
    setSelectedEmployeeHistory({ employee, days: history.data ?? [] });
    setHistoryLoading(false);
  }

  function closeEmployeeModal() {
    setShowEmployeeModal(false);
    setFaceScanning(false);
    setPendingFaceCapture(null);
    setBiometricConsent(false);
    setBiometricFormError('');
  }

  if (unitsLoading || statsLoading) {
    return <LoadingState message="Memuat dashboard Central Attendance..." />;
  }

  // Hitung kesiapan area operasional Bakso Ujo secara real-time dari DB
  const produksihadir = days.filter(d => d.employee?.employee_no === 'UJO-001' && (d.check_in_time || d.status === 'PRESENT')).length;
  const persiapanhadir = days.filter(d => d.employee?.employee_no === 'UJO-002' && (d.check_in_time || d.status === 'PRESENT')).length;
  const servicehadir = days.filter(d => (d.employee?.employee_no === 'UJO-003' || d.employee?.employee_no === 'UJO-005') && (d.check_in_time || d.status === 'PRESENT')).length;
  const closinghadir = days.filter(d => d.employee?.employee_no === 'UJO-004' && (d.check_in_time || d.status === 'PRESENT')).length;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F6F7F9',
      color: '#18212F',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      padding: '20px 24px 60px',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* iOS Top Bar Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 14,
          backgroundColor: '#ffffff',
          padding: '14px 20px',
          borderRadius: 18,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          border: '1px solid #E4E7EC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #3178C6 0%, #3178C6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 18,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
            }}>
              CA
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.3px' }}>
                Central Attendance Realtime Management
              </h1>
              <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>
                Live Database Supabase (Bakso Ujo • GG Supply • GUDSKUY)
              </p>
            </div>
          </div>

          {/* Unit Switcher & Quick Actions */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleAutoSchedule}
              disabled={actionLoadingId === 'auto_sched'}
              style={{
                padding: '6px 14px',
                backgroundColor: '#EEF1F4',
                color: '#3178C6',
                border: '1px solid #E4E7EC',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {actionLoadingId === 'auto_sched' ? 'Memproses...' : '⚡ Sync Realtime Schedule'}
            </button>

            <button
              onClick={() => setSelectedUnitId(undefined)}
              style={{
                padding: '6px 14px',
                backgroundColor: !selectedUnitId ? '#18212F' : '#ffffff',
                color: !selectedUnitId ? '#ffffff' : '#667085',
                border: '1px solid #E4E7EC',
                borderRadius: 9999,
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🏢 Semua Unit
            </button>
            {units.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUnitId(u.id)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: selectedUnitId === u.id ? (u.brand_color ?? '#E96A12') : '#ffffff',
                  color: selectedUnitId === u.id ? '#ffffff' : '#667085',
                  border: '1px solid #E4E7EC',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        {/* iOS Clean Nav Tabs */}
        <div style={{
          display: 'flex',
          gap: 6,
          backgroundColor: '#ffffff',
          padding: '5px',
          borderRadius: 9999,
          width: 'fit-content',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
          border: '1px solid #E4E7EC',
        }}>
          {[
            { key: 'dashboard', label: '📊 Live Monitor & Readiness' },
            { key: 'employees', label: '👥 Kelola Karyawan (Realtime CRUD)' },
            { key: 'shifts', label: '⏰ Kelola Shift (Realtime CRUD)' },
            { key: 'reports', label: '📜 Audit & System Logs' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as AdminTab)}
              style={{
                padding: '8px 16px',
                borderRadius: 9999,
                backgroundColor: activeTab === tab.key ? '#18212F' : 'transparent',
                color: activeTab === tab.key ? '#ffffff' : '#667085',
                border: 'none',
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: DASHBOARD & READINESS */}
        {activeTab === 'dashboard' && (
          <>
            {/* iOS Compact Colorful Stats Cards */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12 }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #E4E7EC', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#667085' }}>Dijadwalkan Hari Ini</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#18212F', marginTop: 2 }}>{stats.scheduled}</div>
                </div>

                <div style={{ backgroundColor: '#EEF1F4', border: '1px solid #EEF1F4', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(16,185,129,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16865B' }}>Hadir (Check-In)</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#16865B', marginTop: 2 }}>{stats.present}</div>
                </div>

                <div style={{ backgroundColor: '#F6F7F9', border: '1px solid #EEF1F4', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(245,158,11,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D8890B' }}>Terlambat</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#D8890B', marginTop: 2 }}>{stats.late}</div>
                </div>

                <div style={{ backgroundColor: '#F6F7F9', border: '1px solid #EEF1F4', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(239,68,68,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#D53F3F' }}>Belum Hadir</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#D53F3F', marginTop: 2 }}>{stats.absent}</div>
                </div>

                <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 16, padding: '14px 16px', boxShadow: '0 4px 15px rgba(139,92,246,0.05)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9' }}>Izin / Cuti</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#5b21b6', marginTop: 2 }}>{stats.on_leave}</div>
                </div>
              </div>
            )}

            {/* Bakso Ujo Readiness Panel */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E4E7EC',
              borderRadius: 18,
              padding: '16px 20px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>
                  Panel Kesiapan Area Operasional (Bakso Ujo Outlet Utama)
                </h3>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#E96A12', backgroundColor: '#F6F7F9', padding: '3px 8px', borderRadius: 9999, border: '1px solid #EEF1F4' }}>
                  Realtime DB
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {[
                  { area: 'Produksi Dini Hari', count: `${produksihadir} / 1 Kru Hadir`, ready: produksihadir >= 1, color: '#E96A12', bg: '#F6F7F9' },
                  { area: 'Persiapan & Dapur', count: `${persiapanhadir} / 1 Kru Hadir`, ready: persiapanhadir >= 1, color: '#3178C6', bg: '#EEF1F4' },
                  { area: 'Service & Kasir', count: `${servicehadir} / 2 Kru Hadir`, ready: servicehadir >= 1, color: '#16865B', bg: '#EEF1F4' },
                  { area: 'Closing Night', count: closinghadir >= 1 ? '1 / 1 Kru Hadir' : 'Kru Belum Hadir', ready: closinghadir >= 1, color: '#8b5cf6', bg: '#f5f3ff' },
                ].map(p => (
                  <div key={p.area} style={{
                    backgroundColor: p.ready ? p.bg : '#F6F7F9',
                    borderRadius: 14,
                    padding: '12px 14px',
                    border: `1px solid ${p.ready ? p.color + '44' : '#E4E7EC'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#18212F' }}>{p.area}</div>
                    <div style={{ fontSize: 11, color: p.ready ? p.color : '#667085', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>{p.ready ? '✅' : '⚠️'}</span> {p.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Monitor Table - DENSE MINIMALIST */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #E4E7EC',
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEF1F4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>Monitor Presensi Hari Ini (Supabase Live)</h3>
                  <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>Presensi real-time pegawai & status verifikasi</p>
                </div>
                <button
                  onClick={() => navigate('/attendance/today')}
                  style={{
                    fontSize: 11,
                    color: '#3178C6',
                    backgroundColor: '#EEF1F4',
                    border: '1px solid #E4E7EC',
                    padding: '6px 12px',
                    borderRadius: 9999,
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  Buka Mobile Mode →
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E7EC', color: '#667085', textAlign: 'left', backgroundColor: '#F6F7F9', height: 36 }}>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>NIP / Pegawai</th>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>Check-In</th>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>Check-Out</th>
                    <th style={{ padding: '6px 16px', fontWeight: 700 }}>Status Presensi</th>
                  </tr>
                </thead>
                <tbody>
                  {days.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#667085', fontWeight: 500 }}>
                        Belum ada data presensi hari ini. Tekan "Sync Realtime Schedule" di atas.
                      </td>
                    </tr>
                  ) : (
                    days.map((d, i) => {
                      const isCheckedIn = !!d.check_in_time || d.status === 'PRESENT';
                      const isCheckedOut = !!d.check_out_time;

                      const avatarColors = ['#E96A12', '#3178C6', '#16865B', '#8b5cf6', '#ec4899'];
                      const avatarBg = avatarColors[i % avatarColors.length];

                      return (
                        <tr key={d.id} style={{ borderBottom: '1px solid #EEF1F4', height: 42 }}>
                          <td style={{ padding: '6px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                backgroundColor: avatarBg,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: 12,
                              }}>
                                {d.employee?.full_name?.charAt(0) ?? 'P'}
                              </div>
                              <div>
                                <span style={{ fontWeight: 700, color: '#18212F' }}>{d.employee?.full_name ?? 'Pegawai'}</span>
                                <span style={{ fontSize: 10, color: '#667085', marginLeft: 6, fontWeight: 600 }}>({d.employee?.employee_no})</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '6px 16px', color: '#16865B', fontWeight: 700 }}>
                            {d.check_in_time ? new Date(d.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '6px 16px', color: '#667085', fontWeight: 600 }}>
                            {d.check_out_time ? new Date(d.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td style={{ padding: '6px 16px' }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 9999,
                              backgroundColor: isCheckedOut ? '#f3e8ff' : isCheckedIn ? '#EEF1F4' : '#EEF1F4',
                              color: isCheckedOut ? '#7c3aed' : isCheckedIn ? '#16865B' : '#D53F3F',
                            }}>
                              {isCheckedOut ? 'SUDAH PULANG' : isCheckedIn ? 'HADIR' : 'BELUM HADIR'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 2: KELOLA KARYAWAN (REALTIME SUPABASE CRUD) */}
        {activeTab === 'employees' && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E4E7EC',
            borderRadius: 18,
            overflow: 'hidden',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>
                  Management Karyawan & Realtime Database Supabase
                </h3>
                <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>
                  Tambah, Edit, Hapus, & Pendaftaran Akses Biometrik Karyawan
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingEmp(null);
                  setNewEmpName('');
                  setNewEmpNo('');
                  setNewEmpPin('');
                  setNewEmpUnitId(units[0]?.id ?? '');
                  setFaceEnrolled(false);
                  setPendingFaceCapture(null);
                  setBiometricConsent(false);
                  setBiometricFormError('');
                  setShowEmployeeModal(true);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#18212F',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
                }}
              >
                + Tambah Karyawan Baru
              </button>
            </div>

            {employeeNotice && (
              <div
                role="status"
                aria-live="polite"
                style={{
                  marginBottom: 14,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: `1px solid ${employeeNotice.type === 'success' ? '#A7D8C5' : '#F0B8B8'}`,
                  backgroundColor: employeeNotice.type === 'success' ? '#ECF8F3' : '#FFF1F1',
                  color: employeeNotice.type === 'success' ? '#126B4B' : '#A62E2E',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {employeeNotice.message}
              </div>
            )}

            {loadingData ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#667085', fontSize: 12 }}>Memuat data pegawai dari Supabase...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E7EC', color: '#667085', textAlign: 'left', backgroundColor: '#F6F7F9', height: 36 }}>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>NIP</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Nama Lengkap</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Email / Username & PIN</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Unit & Jabatan</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Verifikasi Wajah</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Presensi Hari Ini</th>
                    <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>Aksi (CRUD)</th>
                  </tr>
                </thead>
                <tbody>
                  {dbEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 20, textAlign: 'center', color: '#667085' }}>Belum ada data pegawai di Supabase. Tekan Tambah Karyawan Baru.</td>
                    </tr>
                  ) : (
                    dbEmployees.map(emp => {
                      const employeeDay = days.find(day => day.employee_id === emp.id);
                      return (
                      <tr key={emp.id} style={{ borderBottom: '1px solid #EEF1F4', height: 44 }}>
                        <td style={{ padding: '6px 12px', color: '#E96A12', fontWeight: 700 }}>{emp.employee_no}</td>
                        <td style={{ padding: '6px 12px', color: '#18212F', fontWeight: 700 }}>{emp.full_name}</td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 500 }}>
                          <span style={{ color: '#3178C6' }}>{emp.email ?? emp.employee_no}</span>
                          {' · '}
                          <strong>{emp.user_id ? 'PIN hash terlindungi' : 'Akun belum aktif'}</strong>
                        </td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 500 }}>
                          {emp.assignments?.[0]?.business_unit?.name ?? 'Bakso Ujo'} — <strong style={{ color: '#18212F' }}>{emp.assignments?.[0]?.job_title ?? 'Staf Operasional'}</strong>
                        </td>
                        <td style={{ padding: '6px 12px' }}>
                          <span style={{ fontSize: 10, backgroundColor: emp.face_enrolled ? '#ECF8F3' : '#FFF7E8', color: emp.face_enrolled ? '#16865B' : '#B56A00', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, border: `1px solid ${emp.face_enrolled ? '#A7D8C5' : '#F1D19A'}` }}>
                            {emp.face_enrolled ? '✓ Wajah terdaftar' : 'Belum terdaftar'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 600 }}>
                          {employeeDay ? (
                            <button type="button" onClick={() => void handleOpenEmployeeHistory(emp)} style={{ border: 0, padding: 0, background: 'transparent', color: employeeDay.check_in_time ? '#16865B' : '#D53F3F', fontSize: 10, fontWeight: 800, cursor: 'pointer', textAlign: 'left' }}>
                              {employeeDay.check_in_time
                                ? `${new Date(employeeDay.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} ${employeeDay.check_out_time ? `– ${new Date(employeeDay.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : '– aktif'}`
                                : 'Belum hadir'}
                            </button>
                          ) : (
                            <button type="button" onClick={() => void handleOpenEmployeeHistory(emp)} style={{ border: 0, padding: 0, background: 'transparent', color: '#667085', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Lihat riwayat</button>
                          )}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={() => void handleOpenEmployeeHistory(emp)}
                              style={{ padding: '3px 10px', fontSize: 11, borderRadius: 6, border: '1px solid #D8E6E3', backgroundColor: '#F4FAF8', color: '#138A80', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Presensi
                            </button>
                            <button
                              onClick={() => handleOpenEditEmployee(emp)}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #E4E7EC',
                                backgroundColor: '#ffffff',
                                color: '#3178C6',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                              disabled={actionLoadingId === `del_${emp.id}`}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #EEF1F4',
                                backgroundColor: '#F6F7F9',
                                color: '#D53F3F',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {actionLoadingId === `del_${emp.id}` ? '...' : '🗑️ Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: KELOLA SHIFT (REALTIME SUPABASE CRUD) */}
        {activeTab === 'shifts' && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E4E7EC',
            borderRadius: 18,
            overflow: 'hidden',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#18212F', margin: 0, letterSpacing: '-0.2px' }}>
                  Konfigurasi Jam Kerja & Master Template Shift (Supabase Realtime)
                </h3>
                <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', fontWeight: 500 }}>
                  Tambah, Edit, & Hapus jam kerja operasional unit bisnis
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingShift(null);
                  setShiftName('');
                  setShiftCode('');
                  setShowShiftModal(true);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#18212F',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(15,23,42,0.2)',
                }}
              >
                + Tambah Shift Baru
              </button>
            </div>

            {loadingData ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#667085', fontSize: 12 }}>Memuat template shift dari Supabase...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E4E7EC', color: '#667085', textAlign: 'left', backgroundColor: '#F6F7F9', height: 36 }}>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Kode Shift</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Nama Shift</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Jam Kerja</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Toleransi Late</th>
                    <th style={{ padding: '6px 12px', fontWeight: 700 }}>Unit Bisnis</th>
                    <th style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700 }}>Aksi (CRUD)</th>
                  </tr>
                </thead>
                <tbody>
                  {dbShifts.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#667085' }}>Belum ada template shift di Supabase. Tekan Tambah Shift Baru.</td>
                    </tr>
                  ) : (
                    dbShifts.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid #EEF1F4', height: 40 }}>
                        <td style={{ padding: '6px 12px', color: '#E96A12', fontWeight: 700 }}>{s.code}</td>
                        <td style={{ padding: '6px 12px', color: '#18212F', fontWeight: 700 }}>{s.name}</td>
                        <td style={{ padding: '6px 12px', color: '#3178C6', fontWeight: 700 }}>
                          {s.start_time?.slice(0, 5)} - {s.end_time?.slice(0, 5)} WIB
                        </td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 600 }}>{s.late_tolerance_mins ?? 15} Mnt</td>
                        <td style={{ padding: '6px 12px', color: '#667085', fontWeight: 600 }}>
                          {s.business_unit?.name ?? 'Bakso Ujo'}
                        </td>
                        <td style={{ padding: '6px 12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleOpenEditShift(s)}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #E4E7EC',
                                backgroundColor: '#ffffff',
                                color: '#3178C6',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteShift(s.id, s.name)}
                              disabled={actionLoadingId === `del_shift_${s.id}`}
                              style={{
                                padding: '3px 10px',
                                fontSize: 11,
                                borderRadius: 6,
                                border: '1px solid #EEF1F4',
                                backgroundColor: '#F6F7F9',
                                color: '#D53F3F',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              {actionLoadingId === `del_shift_${s.id}` ? '...' : '🗑️ Hapus'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT LOG & SYSTEM LOGS */}
        {activeTab === 'reports' && (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #E4E7EC',
            borderRadius: 18,
            overflow: 'hidden',
            padding: 20,
            boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#18212F', margin: '0 0 14px', letterSpacing: '-0.2px' }}>
              Audit Log System & Realtime Logs (Supabase `attendance_audit_logs`)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dbLogs.length === 0 ? (
                <div style={{ backgroundColor: '#F6F7F9', padding: '12px 14px', borderRadius: 12, fontSize: 12, color: '#667085' }}>
                  Belum ada log aktivitas tersimpan di database.
                </div>
              ) : (
                compactAuditLogs(dbLogs).map((log, idx) => (
                  <div key={log.id ?? idx} style={{ backgroundColor: '#F6F7F9', padding: '10px 14px', borderRadius: 12, fontSize: 11, color: '#667085', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E4E7EC' }}>
                    <div>
                      <strong style={{ color: '#16865B' }}>[{log.entity_type ?? 'SYSTEM'}]</strong>{' '}
                      {auditActionLabel(log.action)}
                      {log.occurrence_count > 1 && (
                        <span style={{ marginLeft: 8, padding: '2px 7px', borderRadius: 9999, background: '#FFF2DB', color: '#A85D00', fontSize: 9, fontWeight: 800 }}>
                          {log.occurrence_count} percobaan serupa
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#667085', fontWeight: 600 }}>{new Date(log.created_at).toLocaleTimeString('id-ID')}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* MODAL: REGISTRASI & EDIT KARYAWAN */}
      {showEmployeeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 440,
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #E4E7EC',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#18212F', margin: 0 }}>
                {editingEmp ? 'Edit Karyawan Supabase' : 'Daftarkan Karyawan & Face ID'}
              </h3>
              <button onClick={() => setShowEmployeeModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#667085', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Nama Lengkap</label>
                <input type="text" placeholder="Misal: Ahmad Zaky" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>NIP / No Pegawai</label>
                  <input type="text" placeholder="UJO-006" value={newEmpNo} onChange={e => setNewEmpNo(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>
                    PIN Kios 6 Digit {!editingEmp && <span style={{ color: '#D53F3F' }}>*</span>}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder={editingEmp ? 'Kosongkan bila tidak diubah' : 'Tepat 6 digit'}
                    value={newEmpPin}
                    onChange={e => setNewEmpPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }}
                  />
                </div>
              </div>

              {!editingEmp && (
                <p style={{ fontSize: 11, color: '#667085', margin: '2px 0 0', lineHeight: 1.5 }}>
                  Akun dibuat khusus untuk sistem <strong>Attendance</strong> dan tidak memperoleh akses
                  Product Launch OS. Kru masuk melalui mode <strong>PIN Kru</strong>; owner/admin wajib
                  memakai identitas dan password akun penuh.
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Unit Bisnis (Terdaftar)</label>
                  <select
                    value={newEmpUnitId || (units[0]?.id ?? '')}
                    onChange={e => setNewEmpUnitId(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4, backgroundColor: '#ffffff', color: '#18212F', fontWeight: 600 }}
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Jabatan / Tugas (Terdaftar)</label>
                  <select
                    value={newEmpRole}
                    onChange={e => setNewEmpRole(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4, backgroundColor: '#ffffff', color: '#18212F', fontWeight: 600 }}
                  >
                    <option value="Staf Produksi Dini Hari">Staf Produksi Dini Hari</option>
                    <option value="Staf Persiapan & Dapur">Staf Persiapan & Dapur</option>
                    <option value="Staf Service & Frontline">Staf Service & Frontline</option>
                    <option value="Staf Closing Night">Staf Closing Night</option>
                    <option value="Kasir & POS">Kasir & POS</option>
                    <option value="Supervisor Outlet">Supervisor Outlet</option>
                    <option value="Manager Operasional">Manager Operasional</option>
                    <option value="Staf Logistik & Kurir">Staf Logistik & Kurir</option>
                  </select>
                </div>
              </div>

              {/* Face ID Biometric Enrollment Section */}
              <div style={{ backgroundColor: '#F6F7F9', border: '1px solid #E4E7EC', borderRadius: 14, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#18212F' }}>📷 Pendaftaran Verifikasi Wajah</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: faceEnrolled ? '#16865B' : '#D8890B', backgroundColor: faceEnrolled ? '#EEF1F4' : '#EEF1F4', padding: '2px 8px', borderRadius: 9999 }}>
                    {pendingFaceCapture ? 'Siap disimpan ✓' : faceEnrolled ? 'Terdaftar ✓' : 'Belum terdaftar'}
                  </span>
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#667085', fontSize: 10, lineHeight: 1.45, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={biometricConsent}
                    onChange={event => {
                      setBiometricConsent(event.target.checked);
                      setBiometricFormError('');
                    }}
                    style={{ marginTop: 2 }}
                  />
                  Karyawan menyetujui pengambilan foto referensi dan descriptor wajah terenkripsi untuk keperluan presensi.
                </label>
                <button
                  type="button"
                  onClick={handleScanFace}
                  disabled={faceScanning}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: faceEnrolled ? '#EEF1F4' : '#EEF1F4',
                    color: faceEnrolled ? '#16865B' : '#3178C6',
                    border: `1px solid ${faceEnrolled ? '#EEF1F4' : '#E4E7EC'}`,
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {faceScanning ? 'Membuka kamera…' : faceEnrolled ? '↻ Daftarkan Ulang Wajah' : '📷 Buka Kamera & Daftarkan Wajah'}
                </button>
                {biometricFormError && <div role="alert" style={{ color: '#A62E2E', fontSize: 10, fontWeight: 700 }}>{biometricFormError}</div>}
                <p style={{ margin: 0, color: '#89919D', fontSize: 9, lineHeight: 1.45 }}>
                  Foto disimpan pada bucket privat. Descriptor dienkripsi di server dan tidak dapat dibaca dari browser.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={closeEmployeeModal} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E4E7EC', backgroundColor: '#ffffff', color: '#667085', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={actionLoadingId === 'save_emp'} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#3178C6', color: '#ffffff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Simpan Ke Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FaceCaptureModal
        open={faceScanning}
        title={faceEnrolled ? 'Daftarkan Ulang Wajah' : 'Daftarkan Wajah Karyawan'}
        instruction="Hadapkan wajah karyawan ke kamera, pastikan wajah tunggal terlihat jelas, lalu ikuti pemeriksaan keaktifan wajah."
        confirmLabel="Gunakan Hasil Pindai"
        onCancel={() => setFaceScanning(false)}
        onCaptured={capture => {
          setPendingFaceCapture(capture);
          setFaceEnrolled(true);
          setFaceScanning(false);
          setBiometricFormError('');
        }}
      />

      {selectedEmployeeHistory && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10005, padding: 16,
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div role="dialog" aria-modal="true" aria-label={`Riwayat presensi ${selectedEmployeeHistory.employee.full_name}`} style={{
            width: '100%', maxWidth: 620, maxHeight: '82vh', overflow: 'auto',
            background: '#fff', border: '1px solid #E4E7EC', borderRadius: 22,
            padding: 22, boxShadow: '0 24px 60px rgba(15, 23, 42, .2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ color: '#667085', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.4px' }}>Riwayat presensi tersimpan</div>
                <h3 style={{ margin: '3px 0 0', color: '#18212F', fontSize: 18 }}>{selectedEmployeeHistory.employee.full_name}</h3>
                <div style={{ color: '#667085', fontSize: 11, marginTop: 3 }}>{selectedEmployeeHistory.employee.employee_no}</div>
              </div>
              <button type="button" onClick={() => setSelectedEmployeeHistory(null)} aria-label="Tutup riwayat" style={{ border: 0, background: '#F1F3F5', borderRadius: 9999, width: 34, height: 34, cursor: 'pointer', color: '#667085', fontSize: 16 }}>✕</button>
            </div>

            {historyLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#667085', fontSize: 12 }}>Memuat riwayat dari database…</div>
            ) : selectedEmployeeHistory.days.length === 0 ? (
              <div style={{ padding: 18, borderRadius: 14, background: '#F6F7F9', color: '#667085', fontSize: 12 }}>Belum ada rekaman presensi untuk karyawan ini.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedEmployeeHistory.days.map(day => (
                  <div key={day.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(105px, .8fr) minmax(160px, 1.2fr) minmax(105px, .8fr)', gap: 12, alignItems: 'center', border: '1px solid #E4E7EC', borderRadius: 14, padding: '11px 13px', background: '#FBFCFD' }}>
                    <div>
                      <div style={{ color: '#18212F', fontSize: 12, fontWeight: 800 }}>{new Date(`${day.work_date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div style={{ color: '#667085', fontSize: 9, marginTop: 2 }}>{day.status}</div>
                    </div>
                    <div style={{ color: '#667085', fontSize: 11, fontWeight: 700 }}>
                      {day.check_in_time ? new Date(day.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      {' — '}
                      {day.check_out_time ? new Date(day.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '--:--'} WIB
                    </div>
                    <span style={{ justifySelf: 'start', borderRadius: 9999, padding: '3px 8px', background: day.check_in_time ? '#ECF8F3' : '#FFF2F2', color: day.check_in_time ? '#16865B' : '#B23A3A', fontSize: 9, fontWeight: 800 }}>
                      {attendanceStatusLabel(day)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SHIFT TEMPLATE MODAL */}
      {showShiftModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            width: '100%',
            maxWidth: 400,
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            border: '1px solid #E4E7EC',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#18212F', margin: 0 }}>
                {editingShift ? 'Edit Template Shift' : 'Tambah Shift Baru'}
              </h3>
              <button onClick={() => setShowShiftModal(false)} style={{ background: 'none', border: 'none', fontSize: 18, color: '#667085', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveShift} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Nama Shift</label>
                <input type="text" placeholder="Shift Midday Express" value={shiftName} onChange={e => setShiftName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Kode Shift</label>
                <input type="text" placeholder="SHIFT_MIDDAY" value={shiftCode} disabled={!!editingShift} onChange={e => setShiftCode(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4, backgroundColor: editingShift ? '#EEF1F4' : '#ffffff' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Jam Masuk</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Jam Pulang</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: '#667085', fontWeight: 700 }}>Toleransi Keterlambatan (Menit)</label>
                <input type="number" value={lateTolerance} onChange={e => setLateTolerance(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #E4E7EC', fontSize: 13, marginTop: 4 }} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setShowShiftModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1px solid #E4E7EC', backgroundColor: '#ffffff', color: '#667085', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={actionLoadingId === 'save_shift'} style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', backgroundColor: '#3178C6', color: '#ffffff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Simpan Ke Supabase</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
